import { notFound, redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GenderTabs } from "@/components/GenderTabs";

const CHOICE_TINT: Record<string, string> = {
  YES: "bg-yes/20 text-on-yes",
  NO: "bg-no/20 text-on-no",
  MAYBE: "bg-secondary/20 text-on-secondary",
};

export default async function VotesPage({
  params,
}: {
  params: Promise<{ gender: string }>;
}) {
  const { gender } = await params;
  if (gender !== "boy" && gender !== "girl") notFound();

  const session = await auth();
  if (!session?.user?.isAdmin && !session?.user?.isViewer) redirect("/vote/boy");

  const names = await prisma.name.findMany({
    where: { gender: gender.toUpperCase() as "BOY" | "GIRL" },
    orderBy: { text: "asc" },
    include: { votes: { include: { user: true } } },
  });

  const buckets: Record<string, typeof names> = {
    bothYes: [],
    bothNo: [],
    bothMaybe: [],
    disagree: [],
    pending: [],
  };

  for (const name of names) {
    const choices = name.votes.map((v) => v.choice);
    if (choices.length === 0) {
      buckets.pending.push(name);
    } else if (choices.every((c) => c === choices[0])) {
      if (choices[0] === "YES") buckets.bothYes.push(name);
      else if (choices[0] === "NO") buckets.bothNo.push(name);
      else buckets.bothMaybe.push(name);
    } else {
      buckets.disagree.push(name);
    }
  }

  const sections: { title: string; key: keyof typeof buckets; tint: string; celebrate?: boolean }[] = [
    { title: "Agreed: yes", key: "bothYes", tint: "bg-match/20 text-on-match", celebrate: true },
    { title: "Disagree", key: "disagree", tint: "bg-primary/15 text-on-primary" },
    { title: "Agreed: on the fence", key: "bothMaybe", tint: "bg-secondary/20 text-on-secondary" },
    { title: "Agreed: no", key: "bothNo", tint: "bg-no/20 text-on-no" },
    { title: "Still waiting on votes", key: "pending", tint: "bg-border/50 text-ink-soft" },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Votes</h1>
        <GenderTabs base="/votes" active={gender} />
      </div>

      <div className="mb-6 flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.key} className="card-shadow rounded-3xl bg-surface p-4">
            <h2 className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
              {section.celebrate && buckets[section.key].length > 0 && (
                <Sparkles size={16} className="text-pop" />
              )}
              {section.title}
              <span className="text-ink-soft">({buckets[section.key].length})</span>
            </h2>
            {buckets[section.key].length === 0 ? (
              <p className="text-sm text-ink-soft">None yet</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {buckets[section.key].map((name) => (
                  <li
                    key={name.id}
                    className={`rounded-full px-3 py-1.5 text-sm font-bold ${section.tint}`}
                  >
                    {name.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="card-shadow rounded-3xl bg-surface p-4">
        <h2 className="mb-3 font-display text-sm font-semibold text-ink">Every vote, by name</h2>
        <ul className="flex flex-col gap-2">
          {names.map((name) => (
            <li key={name.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-bg p-2.5">
              <span className="text-sm font-semibold text-ink">{name.text}</span>
              {name.votes.length === 0 ? (
                <span className="text-xs text-ink-soft">No votes yet</span>
              ) : (
                name.votes.map((v) => (
                  <span
                    key={v.id}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${CHOICE_TINT[v.choice]}`}
                  >
                    {v.user.name ?? v.user.email}: {v.choice}
                  </span>
                ))
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
