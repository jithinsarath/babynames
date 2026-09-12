"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalize, type NameCandidate } from "@/lib/nameParsing";
import { generateNamesFromPreferences, type NamePreferences } from "@/lib/nameGenerate";
import { genderSchema } from "@/lib/validation";
import { notifySubscribers } from "@/lib/push";
import type { PreviewResult } from "@/app/admin/actions";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not authorized");
  return session.user;
}

export async function generateNames(preferences: NamePreferences): Promise<PreviewResult> {
  await requireUser();
  const parsedGender = genderSchema.parse(preferences.gender);

  const candidates = await generateNamesFromPreferences({ ...preferences, gender: parsedGender });

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

export async function confirmInsertGeneratedNames(names: NameCandidate[], gender: string) {
  const user = await requireUser();
  const parsedGender = genderSchema.parse(gender);

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });

  const { count } = await prisma.name.createMany({
    data: names.map(({ text, meaning }) => ({
      text,
      normalizedText: normalize(text),
      meaning,
      gender: parsedGender,
      createdById: dbUser?.id,
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
