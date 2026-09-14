"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { listPendingSuggestions, approveSuggestion, rejectSuggestion } from "@/app/admin/actions";

type SuggestionRow = Awaited<ReturnType<typeof listPendingSuggestions>>[number];

export function SuggestionReview() {
  const [suggestions, setSuggestions] = useState<SuggestionRow[] | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listPendingSuggestions().then(setSuggestions);
  }, []);

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveSuggestion(id);
      setSuggestions((prev) => prev?.filter((s) => s.id !== id) ?? null);
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      await rejectSuggestion(id);
      setSuggestions((prev) => prev?.filter((s) => s.id !== id) ?? null);
    });
  }

  if (suggestions === null) {
    return <p className="text-sm text-ink-soft">Loading…</p>;
  }

  if (suggestions.length === 0) {
    return <p className="text-sm text-ink-soft">No pending suggestions.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {suggestions.map((s) => (
        <li key={s.id} className="card-shadow flex items-center gap-2 rounded-2xl bg-surface p-3">
          <div className="flex-1 text-sm text-ink">
            {s.text}
            {s.meaning && <span className="text-ink-soft"> — {s.meaning}</span>}
            <div className="text-xs text-ink-soft">
              {s.gender === "BOY" ? "Boy" : "Girl"} · suggested by {s.suggestedBy.name ?? s.suggestedBy.email}
            </div>
          </div>
          <button
            onClick={() => handleApprove(s.id)}
            disabled={isPending}
            className="rounded-full bg-yes p-2 text-on-yes disabled:opacity-50"
            aria-label="Approve"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => handleReject(s.id)}
            disabled={isPending}
            className="rounded-full border border-no p-2 text-no disabled:opacity-50"
            aria-label="Reject"
          >
            <X size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
