"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  voteChoiceSchema,
  genderSchema,
  decisionMsSchema,
  deckPositionSchema,
} from "@/lib/validation";

const MAX_DECISION_MS = 5 * 60 * 1000;

export async function castVote(
  nameId: string,
  choice: string,
  gender: string,
  decisionMs?: number,
  deckPosition?: number,
  viaSearch?: boolean,
) {
  const session = await auth();
  if (!session?.user?.email || !session.user.isVoter) {
    throw new Error("Not authorized to vote");
  }

  const parsedChoice = voteChoiceSchema.parse(choice);
  const parsedGender = genderSchema.parse(gender);
  const parsedDecisionMs = decisionMsSchema.parse(decisionMs);
  const parsedDeckPosition = deckPositionSchema.parse(deckPosition);
  // Clamp rather than reject: a backgrounded tab can inflate the raw elapsed
  // time well beyond genuine thinking time.
  const clampedDecisionMs =
    parsedDecisionMs === undefined ? undefined : Math.min(parsedDecisionMs, MAX_DECISION_MS);
  const isViaSearch = !!viaSearch;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session.user.email },
  });

  const existing = await prisma.vote.findUnique({
    where: { userId_nameId: { userId: user.id, nameId } },
  });
  const isFlip = !!existing && existing.choice !== parsedChoice;
  const flipCount = (existing?.flipCount ?? 0) + (isFlip ? 1 : 0);

  await prisma.vote.upsert({
    where: { userId_nameId: { userId: user.id, nameId } },
    update: {
      choice: parsedChoice,
      decisionMs: clampedDecisionMs,
      deckPosition: parsedDeckPosition,
      viaSearch: isViaSearch,
      flipCount,
    },
    create: {
      userId: user.id,
      nameId,
      choice: parsedChoice,
      decisionMs: clampedDecisionMs,
      deckPosition: parsedDeckPosition,
      viaSearch: isViaSearch,
    },
  });

  await prisma.voteEvent.create({
    data: {
      userId: user.id,
      nameId,
      choice: parsedChoice,
      decisionMs: clampedDecisionMs,
      deckPosition: parsedDeckPosition,
      viaSearch: isViaSearch,
    },
  });

  revalidatePath(`/vote/${parsedGender.toLowerCase()}`);
  revalidatePath(`/compare/${parsedGender.toLowerCase()}`);
  revalidatePath(`/rank/${parsedGender.toLowerCase()}`);
}
