import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ViewerManager } from "@/components/ViewerManager";

export default async function ViewersPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/vote/boy");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-5 font-display text-3xl font-semibold text-ink">Viewers</h1>
      <p className="mb-5 text-sm text-ink-soft">
        Viewers can see everyone&apos;s votes and suggest names, but can&apos;t vote themselves.
      </p>
      <ViewerManager />
    </div>
  );
}
