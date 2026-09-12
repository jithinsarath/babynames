"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { listNames, updateName, deleteName } from "@/app/admin/actions";

type NameRow = { id: string; text: string; meaning: string | null };

export function NameManager({ gender }: { gender: "BOY" | "GIRL" }) {
  const [names, setNames] = useState<NameRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listNames(gender).then(setNames);
  }, [gender]);

  function startEdit(row: NameRow) {
    setEditingId(row.id);
    setEditText(row.text);
    setEditMeaning(row.meaning ?? "");
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      await updateName(id, editText.trim(), editMeaning.trim());
      setNames((prev) =>
        prev?.map((n) => (n.id === id ? { ...n, text: editText.trim(), meaning: editMeaning.trim() || null } : n)) ?? null,
      );
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this name (and its votes/rankings)?")) return;
    startTransition(async () => {
      await deleteName(id);
      setNames((prev) => prev?.filter((n) => n.id !== id) ?? null);
    });
  }

  if (names === null) {
    return <p className="text-sm text-ink-soft">Loading names…</p>;
  }

  if (names.length === 0) {
    return <p className="text-sm text-ink-soft">No {gender.toLowerCase()} names yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {names.map((row) => (
        <li key={row.id} className="card-shadow flex items-center gap-2 rounded-2xl bg-surface p-3">
          {editingId === row.id ? (
            <>
              <div className="flex flex-1 flex-col gap-1.5">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-2 py-1 text-sm text-ink outline-none focus:border-primary"
                  placeholder="Name"
                />
                <input
                  value={editMeaning}
                  onChange={(e) => setEditMeaning(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-2 py-1 text-sm text-ink-soft outline-none focus:border-primary"
                  placeholder="Meaning (optional)"
                />
              </div>
              <button
                onClick={() => saveEdit(row.id)}
                disabled={isPending || !editText.trim()}
                className="rounded-full bg-yes p-2 text-on-yes disabled:opacity-50"
                aria-label="Save"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => setEditingId(null)}
                disabled={isPending}
                className="rounded-full border border-border p-2 text-ink-soft"
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 text-sm text-ink">
                {row.text}
                {row.meaning && <span className="text-ink-soft"> — {row.meaning}</span>}
              </div>
              <button
                onClick={() => startEdit(row)}
                disabled={isPending}
                className="rounded-full border border-border p-2 text-ink-soft"
                aria-label="Edit"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(row.id)}
                disabled={isPending}
                className="rounded-full border border-no p-2 text-no"
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
