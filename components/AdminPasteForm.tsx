"use client";

import { useState, useTransition } from "react";
import { previewNames, confirmInsertNames, clearAllNames, type PreviewResult } from "@/app/admin/actions";
import { NameManager } from "@/components/NameManager";

export function AdminPasteForm() {
  const [gender, setGender] = useState<"BOY" | "GIRL">("BOY");
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handlePreview() {
    setMessage(null);
    startTransition(async () => {
      const result = await previewNames(raw, gender);
      setPreview(result);
    });
  }

  function handleConfirm() {
    if (!preview) return;
    startTransition(async () => {
      await confirmInsertNames(preview.newNames, gender);
      setMessage(`Added ${preview.newNames.length} new ${gender.toLowerCase()} names.`);
      setPreview(null);
      setRaw("");
    });
  }

  function handleClearAll() {
    if (!confirm("Delete ALL names (and their votes/rankings)? This cannot be undone.")) return;
    startTransition(async () => {
      await clearAllNames();
      setMessage("Cleared all names.");
      setPreview(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card-shadow flex gap-1 rounded-full bg-surface p-1">
        {(["BOY", "GIRL"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-colors ${
              gender === g ? "bg-primary text-on-primary" : "text-ink-soft"
            }`}
          >
            {g === "BOY" ? "Boy" : "Girl"}
          </button>
        ))}
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Paste names here — one per line, comma-separated, or 'Name | Meaning' per line."
        rows={8}
        className="w-full rounded-2xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />

      <button
        onClick={handlePreview}
        disabled={isPending || !raw.trim()}
        className="card-shadow w-full rounded-full bg-primary py-3 text-sm font-bold text-on-primary disabled:opacity-50 disabled:shadow-none"
      >
        Preview
      </button>

      {message && (
        <p className="rounded-2xl bg-yes/15 px-4 py-3 text-sm font-semibold text-yes">{message}</p>
      )}

      {preview && (
        <div className="card-shadow flex flex-col gap-4 rounded-2xl bg-surface p-4">
          <div>
            <h3 className="mb-1.5 font-display text-sm font-semibold text-primary">
              New ({preview.newNames.length})
            </h3>
            {preview.newNames.length === 0 ? (
              <p className="text-sm text-ink-soft">None</p>
            ) : (
              <p className="text-sm text-ink">
                {preview.newNames
                  .map((n) => (n.meaning ? `${n.text} (${n.meaning})` : n.text))
                  .join(", ")}
              </p>
            )}
          </div>
          <div>
            <h3 className="mb-1.5 font-display text-sm font-semibold text-ink-soft">
              Skipped as duplicate ({preview.duplicateNames.length})
            </h3>
            {preview.duplicateNames.length === 0 ? (
              <p className="text-sm text-ink-soft">None</p>
            ) : (
              <p className="text-sm text-ink-soft">
                {preview.duplicateNames.map((n) => n.text).join(", ")}
              </p>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={isPending || preview.newNames.length === 0}
            className="w-full rounded-full bg-yes py-3 text-sm font-bold text-on-yes disabled:opacity-50"
          >
            Confirm & insert {preview.newNames.length} names
          </button>
        </div>
      )}

      <button
        onClick={handleClearAll}
        disabled={isPending}
        className="w-full rounded-full border border-no py-3 text-sm font-bold text-no disabled:opacity-50"
      >
        Clear all names
      </button>

      <div>
        <h2 className="mb-2 font-display text-lg font-semibold text-ink">
          {gender === "BOY" ? "Boy" : "Girl"} names
        </h2>
        <NameManager key={gender} gender={gender} />
      </div>
    </div>
  );
}
