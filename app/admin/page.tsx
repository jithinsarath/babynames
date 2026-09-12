import { redirect } from "next/navigation";
import { Ban } from "lucide-react";
import { auth } from "@/lib/auth";
import { AdminPasteForm } from "@/components/AdminPasteForm";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/vote/boy");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-5 flex items-center gap-2 font-display text-3xl font-semibold text-ink">
        <Ban size={26} strokeWidth={2.25} />
        No Entry
      </h1>
      <AdminPasteForm />
    </div>
  );
}
