"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { voteChoiceSchema, genderSchema } from "@/lib/validation";

export async function castVote(
  nameId: string,
  choice: string,
  gender: string,
) {
  const session = await auth();
  if (!session?.user?.email || !session.user.isVoter) {
    throw new Error("Not authorized to vote");
  }

  const parsedChoice = voteChoiceSchema.parse(choice);
  const parsedGender = genderSchema.parse(gender);

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
  });

  await prisma.vote.upsert({
    where: { userId_nameId: { userId: user.id, nameId } },
    update: { choice: parsedChoice },
    create: { userId: user.id, nameId, choice: parsedChoice },
  });

  revalidatePath(`/vote/${parsedGender.toLowerCase()}`);
  revalidatePath(`/compare/${parsedGender.toLowerCase()}`);
  revalidatePath(`/rank/${parsedGender.toLowerCase()}`);
}
