import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GenderTabs } from "@/components/GenderTabs";
import { SuggestForm } from "@/components/SuggestForm";

export default async function SuggestPage({
  params,
}: {
  params: Promise<{ gender: string }>;
}) {
  const { gender } = await params;
  if (gender !== "boy" && gender !== "girl") notFound();

  const session = await auth();
  if (!session?.user?.isViewer && !session?.user?.isAdmin) redirect("/vote/boy");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Suggest a name</h1>
        <GenderTabs base="/suggest" active={gender} />
      </div>
      <SuggestForm gender={gender === "boy" ? "BOY" : "GIRL"} />
    </div>
  );
}
