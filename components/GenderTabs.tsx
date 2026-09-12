import Link from "next/link";

export function GenderTabs({
  base,
  active,
}: {
  base: string;
  active: "boy" | "girl";
}) {
  const tabClass = (g: "boy" | "girl") =>
    `flex-1 rounded-full py-2.5 text-center text-sm font-bold transition-colors ${
      g === active
        ? "bg-primary text-on-primary"
        : "text-ink-soft active:bg-border/60"
    }`;

  return (
    <div className="card-shadow flex gap-1 rounded-full bg-surface p-1">
      <Link href={`${base}/boy`} className={tabClass("boy")}>
        Boy
      </Link>
      <Link href={`${base}/girl`} className={tabClass("girl")}>
        Girl
      </Link>
    </div>
  );
}
