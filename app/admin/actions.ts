"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractCandidateNames, normalize, type NameCandidate } from "@/lib/nameParsing";
import { suggestNamesFromRankings } from "@/lib/nameSuggest";
import { genderSchema } from "@/lib/validation";
import { notifySubscribers } from "@/lib/push";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Not authorized");
  return session.user;
}

export interface PreviewResult {
  newNames: NameCandidate[];
  duplicateNames: NameCandidate[];
}

export async function previewNames(raw: string, gender: string): Promise<PreviewResult> {
  await requireAdmin();
  const parsedGender = genderSchema.parse(gender);

  const { candidates } = extractCandidateNames(raw);

  const existing = await prisma.name.findMany({
    where: { gender: parsedGender },
    select: { normalizedText: true },
  });
  const existingSet = new Set(existing.map((n) => n.normalizedText));

  const newNames: NameCandidate[] = [];
  const duplicateNames: NameCandidate[] = [];

  for (const candidate of candidates) {
    if (existingSet.has(normalize(candidate.text))) {
      duplicateNames.push(candidate);
    } else {
      newNames.push(candidate);
    }
  }

  return { newNames, duplicateNames };
}

export async function suggestNames(gender: string): Promise<PreviewResult> {
  await requireAdmin();
  const parsedGender = genderSchema.parse(gender);

  const candidates = await suggestNamesFromRankings(parsedGender);

  const existing = await prisma.name.findMany({
    where: { gender: parsedGender },
    select: { normalizedText: true },
  });
  const existingSet = new Set(existing.map((n) => n.normalizedText));

  const newNames: NameCandidate[] = [];
  const duplicateNames: NameCandidate[] = [];

  for (const candidate of candidates) {
    if (existingSet.has(normalize(candidate.text))) {
      duplicateNames.push(candidate);
    } else {
      newNames.push(candidate);
    }
  }

  return { newNames, duplicateNames };
}

export async function confirmInsertNames(names: NameCandidate[], gender: string) {
  const user = await requireAdmin();
  const parsedGender = genderSchema.parse(gender);

  const admin = await prisma.user.findUnique({ where: { email: user.email! } });

  const { count } = await prisma.name.createMany({
    data: names.map(({ text, meaning }) => ({
      text,
      normalizedText: normalize(text),
      meaning,
      gender: parsedGender,
      createdById: admin?.id,
    })),
    skipDuplicates: true,
  });

  revalidatePath(`/vote/${parsedGender.toLowerCase()}`);

  if (count > 0) {
    const genderLabel = parsedGender === "BOY" ? "boy" : "girl";
    await notifySubscribers({
      title: "New names to vote on!",
      body: `${count} new ${genderLabel} name${count === 1 ? "" : "s"} just added.`,
      url: `/vote/${genderLabel}`,
    });
  }
}

export async function listNames(gender: string) {
  await requireAdmin();
  const parsedGender = genderSchema.parse(gender);

  return prisma.name.findMany({
    where: { gender: parsedGender },
    orderBy: { text: "asc" },
    select: { id: true, text: true, meaning: true },
  });
}

export async function updateName(id: string, text: string, meaning: string) {
  await requireAdmin();

  await prisma.name.update({
    where: { id },
    data: { text, normalizedText: normalize(text), meaning: meaning || null },
  });

  revalidatePath("/vote/boy");
  revalidatePath("/vote/girl");
}

export async function deleteName(id: string) {
  await requireAdmin();

  await prisma.name.delete({ where: { id } });

  revalidatePath("/vote/boy");
  revalidatePath("/vote/girl");
}

export async function clearAllNames() {
  await requireAdmin();

  await prisma.name.deleteMany();

  revalidatePath("/vote/boy");
  revalidatePath("/vote/girl");
}

export async function sendTestNotification() {
  const admin = await requireAdmin();

  const user = await prisma.user.findUniqueOrThrow({ where: { email: admin.email! } });

  await notifySubscribers(
    {
      title: "Test notification",
      body: "If you can see this, push notifications are working.",
      url: "/admin",
    },
    { userId: user.id },
  );
}
