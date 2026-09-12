import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GenderTabs } from "@/components/GenderTabs";
import { SwipeDeck } from "@/components/SwipeDeck";

export default async function VotePage({
  params,
}: {
  params: Promise<{ gender: string }>;
}) {
  const { gender } = await params;
  if (gender !== "boy" && gender !== "girl") notFound();

  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: session!.user!.email! },
  });

  const names = await prisma.name.findMany({
    where: { gender: gender.toUpperCase() as "BOY" | "GIRL" },
    orderBy: { text: "asc" },
    include: { votes: { where: { userId: user.id } } },
  });

  const deckNames = names.map((name) => ({
    id: name.id,
    text: name.text,
    meaning: name.meaning,
    currentChoice: name.votes[0]?.choice ?? null,
  }));

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Vote</h1>
        <GenderTabs base="/vote" active={gender} />
      </div>

      {deckNames.length === 0 ? (
        <p className="card-shadow rounded-3xl bg-surface px-4 py-8 text-center text-sm text-ink-soft">
          No names yet — ask the admin to add some.
        </p>
      ) : (
        <SwipeDeck key={gender} names={deckNames} gender={gender} />
      )}
    </div>
  );
}
