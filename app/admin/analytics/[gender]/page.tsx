import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GenderTabs } from "@/components/GenderTabs";
import { formatMs } from "@/lib/formatMs";

const INSTANT_MS = 1500;
const DELIBERATED_MS = 8000;

const CHOICE_TINT: Record<string, string> = {
  YES: "bg-yes/20 text-on-yes",
  NO: "bg-no/20 text-on-no",
  MAYBE: "bg-secondary/20 text-on-secondary",
};

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ gender: string }>;
}) {
  const { gender } = await params;
  if (gender !== "boy" && gender !== "girl") notFound();

  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/vote/boy");

  const names = await prisma.name.findMany({
    where: { gender: gender.toUpperCase() as "BOY" | "GIRL" },
    orderBy: { text: "asc" },
    include: { votes: { include: { user: true } } },
  });
  const nameById = new Map(names.map((n) => [n.id, n.text]));

  const timedVotes = names.flatMap((name) =>
    name.votes
      .filter((v) => v.decisionMs !== null)
      .map((v) => ({ name: name.text, ...v, decisionMs: v.decisionMs! })),
  );

  const quickYes = timedVotes
    .filter((v) => v.choice === "YES" && v.decisionMs < INSTANT_MS)
    .sort((a, b) => a.decisionMs - b.decisionMs);
  const quickNo = timedVotes
    .filter((v) => v.choice === "NO" && v.decisionMs < INSTANT_MS)
    .sort((a, b) => a.decisionMs - b.decisionMs);
  const deliberated = timedVotes
    .filter((v) => v.decisionMs > DELIBERATED_MS)
    .sort((a, b) => b.decisionMs - a.decisionMs);

  const avgByChoice = (["YES", "NO", "MAYBE"] as const).map((choice) => {
    const vs = timedVotes.filter((v) => v.choice === choice);
    const avg = vs.length ? vs.reduce((sum, v) => sum + v.decisionMs, 0) / vs.length : null;
    return { choice, avg, count: vs.length };
  });

  const sections: { title: string; votes: typeof timedVotes }[] = [
    { title: `Instant yes (< ${formatMs(INSTANT_MS)})`, votes: quickYes },
    { title: `Instant no (< ${formatMs(INSTANT_MS)})`, votes: quickNo },
    { title: `Deliberated (> ${formatMs(DELIBERATED_MS)})`, votes: deliberated },
  ];

  const changedMind = names
    .flatMap((name) =>
      name.votes
        .filter((v) => v.flipCount > 0)
        .map((v) => ({ name: name.text, ...v })),
    )
    .sort((a, b) => b.flipCount - a.flipCount);

  // Full decision history (not just current state) so we can tell whether a
  // name grew on someone or fell out of favor over time, not just its latest
  // status.
  const events = await prisma.voteEvent.findMany({
    where: { nameId: { in: names.map((n) => n.id) } },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  const eventGroups = new Map<string, typeof events>();
  for (const e of events) {
    const key = `${e.userId}:${e.nameId}`;
    const group = eventGroups.get(key);
    if (group) group.push(e);
    else eventGroups.set(key, [e]);
  }

  const grewOnThem: { name: string; user: string }[] = [];
  const fellOutOfFavor: { name: string; user: string }[] = [];
  for (const group of eventGroups.values()) {
    let improved = false;
    let soured = false;
    for (let i = 1; i < group.length; i++) {
      const prev = group[i - 1].choice;
      const cur = group[i].choice;
      if (prev !== "YES" && cur === "YES") improved = true;
      if (prev === "YES" && cur !== "YES") soured = true;
    }
    const { user, nameId } = group[0];
    const entry = { name: nameById.get(nameId) ?? "?", user: user.name ?? user.email };
    if (improved) grewOnThem.push(entry);
    if (soured) fellOutOfFavor.push(entry);
  }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const votingRhythm = DAY_LABELS.map((label, i) => ({
    label,
    count: events.filter((e) => new Date(e.createdAt).getDay() === i).length,
  }));
  const maxRhythmCount = Math.max(1, ...votingRhythm.map((d) => d.count));

  const searchShare = events.length
    ? Math.round((events.filter((e) => e.viaSearch).length / events.length) * 100)
    : null;

  const positioned = names
    .flatMap((name) => name.votes.filter((v) => v.deckPosition !== null))
    .sort((a, b) => a.deckPosition! - b.deckPosition!);
  const noRate = (vs: typeof positioned) =>
    vs.length ? Math.round((vs.filter((v) => v.choice === "NO").length / vs.length) * 100) : null;
  const midpoint = Math.floor(positioned.length / 2);
  const fatigue = {
    firstHalfNoRate: noRate(positioned.slice(0, midpoint)),
    secondHalfNoRate: noRate(positioned.slice(midpoint)),
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Analytics</h1>
        <GenderTabs base="/admin/analytics" active={gender} />
      </div>

      <div className="card-shadow mb-4 grid grid-cols-3 gap-2 rounded-3xl bg-surface p-4">
        {avgByChoice.map(({ choice, avg, count }) => (
          <div key={choice} className="flex flex-col items-center gap-1">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${CHOICE_TINT[choice]}`}
            >
              {choice}
            </span>
            <span className="font-display text-lg font-semibold text-ink">
              {avg !== null ? formatMs(Math.round(avg)) : "—"}
            </span>
            <span className="text-xs text-ink-soft">{count} timed</span>
          </div>
        ))}
      </div>

      {timedVotes.length === 0 && (
        <p className="card-shadow rounded-3xl bg-surface px-4 py-8 text-center text-sm text-ink-soft">
          No timed votes yet — timing is captured going forward as people vote.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.title} className="card-shadow rounded-3xl bg-surface p-4">
            <h2 className="mb-3 font-display text-sm font-semibold text-ink">
              {section.title} <span className="text-ink-soft">({section.votes.length})</span>
            </h2>
            {section.votes.length === 0 ? (
              <p className="text-sm text-ink-soft">None</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {section.votes.slice(0, 20).map((v) => (
                  <li
                    key={v.id}
                    className={`rounded-full px-3 py-1.5 text-sm font-bold ${CHOICE_TINT[v.choice]}`}
                  >
                    {v.name}
                    <span className="ml-1 text-xs font-normal opacity-70">
                      {formatMs(v.decisionMs)} · {v.user.name ?? v.user.email}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div className="card-shadow rounded-3xl bg-surface p-4">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">
            Changed their mind <span className="text-ink-soft">({changedMind.length})</span>
          </h2>
          {changedMind.length === 0 ? (
            <p className="text-sm text-ink-soft">None</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {changedMind.slice(0, 20).map((v) => (
                <li
                  key={v.id}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ${CHOICE_TINT[v.choice]}`}
                >
                  {v.name}
                  <span className="ml-1 text-xs font-normal opacity-70">
                    {v.flipCount}× · {v.user.name ?? v.user.email}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-shadow rounded-3xl bg-surface p-4">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">
            Grew on them <span className="text-ink-soft">({grewOnThem.length})</span>
          </h2>
          {grewOnThem.length === 0 ? (
            <p className="text-sm text-ink-soft">None</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {grewOnThem.slice(0, 20).map((e, i) => (
                <li key={i} className="rounded-full bg-yes/20 px-3 py-1.5 text-sm font-bold text-on-yes">
                  {e.name}
                  <span className="ml-1 text-xs font-normal opacity-70">{e.user}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-shadow rounded-3xl bg-surface p-4">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">
            Fell out of favor <span className="text-ink-soft">({fellOutOfFavor.length})</span>
          </h2>
          {fellOutOfFavor.length === 0 ? (
            <p className="text-sm text-ink-soft">None</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {fellOutOfFavor.slice(0, 20).map((e, i) => (
                <li key={i} className="rounded-full bg-no/20 px-3 py-1.5 text-sm font-bold text-on-no">
                  {e.name}
                  <span className="ml-1 text-xs font-normal opacity-70">{e.user}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-shadow rounded-3xl bg-surface p-4">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Voting rhythm</h2>
          <div className="flex items-end gap-2">
            {votingRhythm.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-primary/70"
                  style={{ height: `${Math.max(4, (d.count / maxRhythmCount) * 60)}px` }}
                />
                <span className="text-[10px] font-semibold text-ink-soft">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-shadow rounded-3xl bg-surface p-4">
          <h2 className="mb-3 font-display text-sm font-semibold text-ink">Discovery & fatigue</h2>
          <p className="text-sm text-ink-soft">
            {searchShare !== null ? `${searchShare}% of decisions came via search.` : "No decisions yet."}
          </p>
          {fatigue.firstHalfNoRate !== null && fatigue.secondHalfNoRate !== null && (
            <p className="mt-1 text-sm text-ink-soft">
              No-rate: {fatigue.firstHalfNoRate}% early in the deck vs {fatigue.secondHalfNoRate}% late —{" "}
              {fatigue.secondHalfNoRate > fatigue.firstHalfNoRate
                ? "attention seems to drop off later on."
                : "no sign of late-deck fatigue."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
