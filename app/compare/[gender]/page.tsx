import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { GenderTabs } from "@/components/GenderTabs";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function ComparePage({
  params,
}: {
  params: Promise<{ gender: string }>;
}) {
  const { gender } = await params;
  if (gender !== "boy" && gender !== "girl") notFound();

  const voters = await prisma.user.findMany({
    where: { email: { in: ALLOWED_EMAILS } },
  });

  const names = await prisma.name.findMany({
    where: { gender: gender.toUpperCase() as "BOY" | "GIRL" },
    orderBy: { text: "asc" },
    include: { votes: true },
  });

  const [voterA, voterB] = voters;

  const buckets: Record<string, typeof names> = {
    bothYes: [],
    bothNo: [],
    bothMaybe: [],
    disagree: [],
    pending: [],
  };

  for (const name of names) {
    const choiceA = name.votes.find((v) => v.userId === voterA?.id)?.choice;
    const choiceB = name.votes.find((v) => v.userId === voterB?.id)?.choice;

    if (!choiceA || !choiceB) {
      buckets.pending.push(name);
    } else if (choiceA === choiceB) {
      if (choiceA === "YES") buckets.bothYes.push(name);
      else if (choiceA === "NO") buckets.bothNo.push(name);
      else buckets.bothMaybe.push(name);
    } else {
      buckets.disagree.push(name);
    }
  }

  const sections: { title: string; key: keyof typeof buckets; tint: string; celebrate?: boolean }[] = [
    { title: "You both said yes", key: "bothYes", tint: "bg-match/20 text-on-match", celebrate: true },
    { title: "Disagree", key: "disagree", tint: "bg-primary/15 text-on-primary" },
    { title: "Both on the fence", key: "bothMaybe", tint: "bg-secondary/20 text-on-secondary" },
    { title: "Both said no", key: "bothNo", tint: "bg-no/20 text-on-no" },
    { title: "Still waiting on votes", key: "pending", tint: "bg-border/50 text-ink-soft" },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Compare</h1>
        <GenderTabs base="/compare" active={gender} />
      </div>

      {!voterB && (
        <p className="mb-4 rounded-2xl bg-secondary/20 px-4 py-3 text-sm font-semibold text-on-secondary">
          Waiting on both parents to sign in at least once before comparisons make sense.
        </p>
      )}

      <div className="flex flex-col gap-4">
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
                    {section.key === "disagree" && (
                      <span className="ml-1 text-xs font-normal opacity-70">
                        ({name.votes.find((v) => v.userId === voterA?.id)?.choice ?? "?"} /{" "}
                        {name.votes.find((v) => v.userId === voterB?.id)?.choice ?? "?"})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
