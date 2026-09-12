"use client";

import { useState, useTransition } from "react";
import { generateNames, confirmInsertGeneratedNames } from "@/actions/generate";
import type { PreviewResult } from "@/app/admin/actions";

const STYLES = ["Modern", "Classic", "Unique", "Nature", "Vintage"];
const POPULARITY = ["Rare", "Uncommon", "Popular"];

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? null : opt)}
          className={`card-shadow rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            value === opt ? "bg-primary text-on-primary" : "bg-surface text-ink-soft"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function NameGeneratorForm({ gender }: { gender: "BOY" | "GIRL" }) {
  const [style, setStyle] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [startingLetter, setStartingLetter] = useState("");
  const [syllableCount, setSyllableCount] = useState("");
  const [popularity, setPopularity] = useState<string | null>(null);
  const [nicknameFriendly, setNicknameFriendly] = useState(false);
  const [theme, setTheme] = useState("");
  const [notes, setNotes] = useState("");

  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleGenerate() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await generateNames({
          gender,
          style: style ?? undefined,
          origin: origin.trim() || undefined,
          startingLetter: startingLetter.trim() || undefined,
          syllableCount: syllableCount.trim() || undefined,
          popularity: popularity ?? undefined,
          nicknameFriendly,
          theme: theme.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        setPreview(result);
        if (result.newNames.length === 0) {
          setMessage("No new names generated this time — try adjusting your preferences.");
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to generate names.");
      }
    });
  }

  function handleConfirm() {
    if (!preview) return;
    startTransition(async () => {
      await confirmInsertGeneratedNames(preview.newNames, gender);
      setMessage(`Added ${preview.newNames.length} new ${gender.toLowerCase()} names.`);
      setPreview(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">Style</label>
        <PillGroup options={STYLES} value={style} onChange={setStyle} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">Popularity</label>
        <PillGroup options={POPULARITY} value={popularity} onChange={setPopularity} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Origin / culture</label>
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. Irish"
            className="w-full rounded-2xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Starting letter</label>
          <input
            value={startingLetter}
            onChange={(e) => setStartingLetter(e.target.value.slice(0, 1))}
            placeholder="e.g. A"
            maxLength={1}
            className="w-full rounded-2xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Syllable count</label>
          <input
            value={syllableCount}
            onChange={(e) => setSyllableCount(e.target.value)}
            placeholder="e.g. 2"
            className="w-full rounded-2xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Theme / meaning</label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. strength"
            className="w-full rounded-2xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={nicknameFriendly}
          onChange={(e) => setNicknameFriendly(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Nickname-friendly
      </label>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything else — sibling names to complement, names to avoid, family traditions…"
        rows={4}
        className="w-full rounded-2xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />

      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="card-shadow w-full rounded-full bg-primary py-3 text-sm font-bold text-on-primary disabled:opacity-50 disabled:shadow-none"
      >
        Generate names
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
            Confirm &amp; insert {preview.newNames.length} names
          </button>
        </div>
      )}
    </div>
  );
}
