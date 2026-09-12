import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GenderTabs } from "@/components/GenderTabs";
import { NameGeneratorForm } from "@/components/NameGeneratorForm";

export default async function GeneratePage({
  params,
}: {
  params: Promise<{ gender: string }>;
}) {
  const { gender } = await params;
  if (gender !== "boy" && gender !== "girl") notFound();

  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">Generate</h1>
        <GenderTabs base="/generate" active={gender} />
      </div>

      <NameGeneratorForm key={gender} gender={gender === "boy" ? "BOY" : "GIRL"} />
    </div>
  );
}
