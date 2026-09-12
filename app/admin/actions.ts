"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractCandidateNames, normalize, type NameCandidate } from "@/lib/nameParsing";
import { genderSchema } from "@/lib/validation";

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

export async function confirmInsertNames(names: NameCandidate[], gender: string) {
  const user = await requireAdmin();
  const parsedGender = genderSchema.parse(gender);

  const admin = await prisma.user.findUnique({ where: { email: user.email! } });

  await prisma.name.createMany({
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
}

export async function clearAllNames() {
  await requireAdmin();

  await prisma.name.deleteMany();

  revalidatePath("/vote/boy");
  revalidatePath("/vote/girl");
}
