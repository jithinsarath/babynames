"use client";

import { useState, useTransition } from "react";
import { submitSuggestion } from "@/app/suggest/actions";

export function SuggestForm({ gender }: { gender: "BOY" | "GIRL" }) {
  const [text, setText] = useState("");
  const [meaning, setMeaning] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit() {
    setMessage(null);
    startTransition(async () => {
      try {
        await submitSuggestion(text, meaning, gender);
        setMessage(`Suggested "${text.trim()}" — the admin has been notified.`);
        setText("");
        setMeaning("");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to submit suggestion.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Name"
        className="w-full rounded-2xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <input
        value={meaning}
        onChange={(e) => setMeaning(e.target.value)}
        placeholder="Meaning (optional)"
        className="w-full rounded-2xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <button
        onClick={handleSubmit}
        disabled={isPending || !text.trim()}
        className="card-shadow w-full rounded-full bg-primary py-3 text-sm font-bold text-on-primary disabled:opacity-50 disabled:shadow-none"
      >
        Suggest
      </button>
      {message && (
        <p className="rounded-2xl bg-yes/15 px-4 py-3 text-sm font-semibold text-yes">{message}</p>
      )}
    </div>
  );
}
