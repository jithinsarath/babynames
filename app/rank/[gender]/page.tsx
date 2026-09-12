import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GenderTabs } from "@/components/GenderTabs";
import { RankingSlider } from "@/components/RankingSlider";

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
    include: { rankings: true },
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
          {names.map((name) => {
            const myScore = name.rankings.find((r) => r.userId === user.id)?.score ?? null;
            const theirScore = otherVoter
              ? name.rankings.find((r) => r.userId === otherVoter.id)?.score ?? null
              : null;

            return (
              <li key={name.id} className="card-shadow flex flex-col gap-3 rounded-3xl bg-surface px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-semibold text-ink">{name.text}</span>
                  {theirScore !== null && (
                    <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-on-primary">
                      their score: {theirScore}
                    </span>
                  )}
                </div>
                <RankingSlider nameId={name.id} gender={gender} initialScore={myScore} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
