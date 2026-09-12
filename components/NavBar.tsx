import Link from "next/link";
import { Heart, Users, Star, Ban } from "lucide-react";
import { auth, signOut } from "@/lib/auth";

const TABS = [
  { href: "/vote/boy", label: "Vote", Icon: Heart },
  { href: "/compare/boy", label: "Compare", Icon: Users },
  { href: "/rank/boy", label: "Rank", Icon: Star },
];

export async function NavBar() {
  const session = await auth();
  if (!session?.user) return null;

  const tabs = session.user.isAdmin
    ? [...TABS, { href: "/admin", label: "No Entry", Icon: Ban }]
    : TABS;

  return (
    <>
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-display text-lg font-semibold text-ink">
          naming kp <span className="text-primary">;)</span>
        </span>
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
