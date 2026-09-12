import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Baby } from "lucide-react";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/vote/boy");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <div className="card-shadow mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-primary">
          <Baby size={30} strokeWidth={2} />
        </div>
        <h1 className="font-display text-3xl font-semibold text-ink">
          naming kp <span className="text-primary">;)</span>
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Pick names together, one yes/no/maybe at a time.
        </p>
      </div>

      {error && (
        <p className="max-w-sm rounded-2xl bg-no/20 px-4 py-3 text-sm font-semibold text-ink">
          That Google account isn&apos;t invited to this app.
        </p>
      )}

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/vote/boy" });
        }}
      >
        <button
          type="submit"
          className="card-shadow-lg rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-on-primary transition-transform active:scale-[0.97]"
        >
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
