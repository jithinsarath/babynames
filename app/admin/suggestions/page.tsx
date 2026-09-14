import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SuggestionReview } from "@/components/SuggestionReview";

export default async function SuggestionsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/vote/boy");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-5 font-display text-3xl font-semibold text-ink">Suggestions</h1>
      <SuggestionReview />
    </div>
  );
}
