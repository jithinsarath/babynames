"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rankScoreSchema, genderSchema } from "@/lib/validation";

export async function setRanking(
  nameId: string,
  score: number,
  gender: string,
) {
  const session = await auth();
  if (!session?.user?.email || !session.user.isVoter) {
    throw new Error("Not authorized to rank");
  }

  const parsedScore = rankScoreSchema.parse(score);
  const parsedGender = genderSchema.parse(gender);

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
  });

  const vote = await prisma.vote.findUnique({
    where: { userId_nameId: { userId: user.id, nameId } },
  });

  if (!vote || vote.choice !== "YES") {
    throw new Error("Can only rank names you voted YES on");
  }

  const existing = await prisma.ranking.findUnique({
    where: { userId_nameId: { userId: user.id, nameId } },
  });
  const revisionCount =
    (existing?.revisionCount ?? 0) + (existing && existing.score !== parsedScore ? 1 : 0);

  await prisma.ranking.upsert({
    where: { userId_nameId: { userId: user.id, nameId } },
    update: { score: parsedScore, revisionCount },
    create: { userId: user.id, nameId, score: parsedScore },
  });

  revalidatePath(`/rank/${parsedGender.toLowerCase()}`);
}
