import { notFound } from "next/navigation";
import { Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GenderTabs } from "@/components/GenderTabs";
import { RankingSlider } from "@/components/RankingSlider";
import { formatMs } from "@/lib/formatMs";

const INSTANT_MS = 1500;

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function RankPage({
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

  const otherVoterEmail = ALLOWED_EMAILS.find(
    (e) => e !== session!.user!.email!.toLowerCase(),
  );
  const otherVoter = otherVoterEmail
    ? await prisma.user.findUnique({ where: { email: otherVoterEmail } })
    : null;

  const names = await prisma.name.findMany({
    where: {
      gender: gender.toUpperCase() as "BOY" | "GIRL",
      votes: { some: { userId: user.id, choice: "YES" } },
    },
    orderBy: { text: "asc" },
    include: { rankings: true, votes: { where: { userId: user.id } } },
  });

  // Surface gut-reaction yeses first: the faster you said yes, the stronger
  // the signal, so those are the most useful to score first. Untimed votes
  // (cast before we tracked this) sort to the end.
  const sortedNames = [...names].sort((a, b) => {
    const msA = a.votes[0]?.decisionMs ?? Infinity;
    const msB = b.votes[0]?.decisionMs ?? Infinity;
    return msA - msB;
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Rank</h1>
        <GenderTabs base="/rank" active={gender} />
      </div>

      {names.length === 0 ? (
        <p className="card-shadow rounded-3xl bg-surface px-4 py-8 text-center text-sm text-ink-soft">
          Vote Yes on some names first, then come back here to score them.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sortedNames.map((name) => {
            const myRanking = name.rankings.find((r) => r.userId === user.id);
            const myScore = myRanking?.score ?? null;
            const theirScore = otherVoter
              ? name.rankings.find((r) => r.userId === otherVoter.id)?.score ?? null
              : null;
            const myDecisionMs = name.votes[0]?.decisionMs ?? null;
            const myRevisionCount = myRanking?.revisionCount ?? 0;

            return (
              <li key={name.id} className="card-shadow flex flex-col gap-3 rounded-3xl bg-surface px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
                    {name.text}
                    {myDecisionMs !== null && myDecisionMs < INSTANT_MS && (
                      <Zap size={16} className="text-match" />
                    )}
                  </span>
                  {theirScore !== null && (
                    <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-on-primary">
                      their score: {theirScore}
                    </span>
                  )}
                </div>
                {myDecisionMs !== null && (
                  <span className="text-xs font-semibold text-ink-soft">
                    you said yes in {formatMs(myDecisionMs)}
                    {myRevisionCount > 0 && ` · changed your mind ${myRevisionCount}× while scoring`}
                  </span>
                )}
                <RankingSlider nameId={name.id} gender={gender} initialScore={myScore} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
