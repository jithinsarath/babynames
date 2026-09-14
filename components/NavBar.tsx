import Link from "next/link";
import { Heart, Users, Star, Ban, BarChart3, Sparkles, Eye, MessageSquarePlus } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PushOptIn } from "@/components/PushOptIn";

const TABS = [
  { href: "/vote/boy", label: "Vote", Icon: Heart },
  { href: "/generate/boy", label: "Generate", Icon: Sparkles },
  { href: "/compare/boy", label: "Compare", Icon: Users },
  { href: "/rank/boy", label: "Rank", Icon: Star },
];

const VIEWER_TABS = [
  { href: "/votes/boy", label: "Votes", Icon: Eye },
  { href: "/suggest/boy", label: "Suggest", Icon: MessageSquarePlus },
];

export async function NavBar() {
  const session = await auth();
  if (!session?.user) return null;

  let tabs = session.user.isVoter ? TABS : [];

  if (session.user.isViewer && !session.user.isAdmin) {
    tabs = [...tabs, ...VIEWER_TABS];
  }

  if (session.user.isAdmin) {
    const pendingCount = await prisma.nameSuggestion.count({ where: { status: "PENDING" } });
    tabs = [
      ...tabs,
      { href: "/votes/boy", label: "Votes", Icon: Eye },
      {
        href: "/admin/suggestions",
        label: pendingCount > 0 ? `Suggestions (${pendingCount})` : "Suggestions",
        Icon: MessageSquarePlus,
      },
      { href: "/admin/viewers", label: "Viewers", Icon: Users },
      { href: "/admin/analytics/boy", label: "Stats", Icon: BarChart3 },
      { href: "/admin", label: "No Entry", Icon: Ban },
    ];
  }

  return (
    <>
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-display text-lg font-semibold text-ink">
          naming kp <span className="text-primary">;)</span>
        </span>
        <div className="flex items-center gap-3">
          {session.user.isVoter && <PushOptIn />}
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/signin" });
            }}
          >
            <button type="submit" className="text-sm font-semibold text-ink-soft active:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <nav
        className="card-shadow-lg fixed inset-x-4 bottom-4 z-10 mx-auto flex max-w-md gap-1 rounded-[28px] bg-surface p-1.5"
        style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom))" }}
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center gap-1 rounded-3xl py-2.5 text-ink-soft active:bg-primary/15 active:text-primary"
          >
            <tab.Icon size={20} strokeWidth={2.25} />
            <span className="text-[11px] font-bold">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
