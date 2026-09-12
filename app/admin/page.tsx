import { redirect } from "next/navigation";
import { Ban, Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { AdminPasteForm } from "@/components/AdminPasteForm";
import { sendTestNotification } from "@/app/admin/actions";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/vote/boy");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-5 flex items-center gap-2 font-display text-3xl font-semibold text-ink">
        <Ban size={26} strokeWidth={2.25} />
        No Entry
      </h1>
      <form action={sendTestNotification} className="mb-5">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-full bg-secondary/15 px-4 py-2 text-sm font-bold text-on-secondary"
        >
          <Bell size={16} />
          Send test notification (to you only)
        </button>
      </form>
      <AdminPasteForm />
    </div>
  );
}
