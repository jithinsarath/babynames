"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { listNames, updateName, deleteName, bulkDeleteNames } from "@/app/admin/actions";

type NameRow = { id: string; text: string; meaning: string | null };

export function NameManager({ gender }: { gender: "BOY" | "GIRL" }) {
  const [names, setNames] = useState<NameRow[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === names?.length ? new Set() : new Set(names?.map((n) => n.id))));
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} name${ids.length === 1 ? "" : "s"} (and their votes/rankings)?`)) return;
    startTransition(async () => {
      await bulkDeleteNames(ids);
      setNames((prev) => prev?.filter((n) => !selectedIds.has(n.id)) ?? null);
      setSelectedIds(new Set());
    });
  }

  if (names === null) {
    return <p className="text-sm text-ink-soft">Loading names…</p>;
  }

  if (names.length === 0) {
    return <p className="text-sm text-ink-soft">No {gender.toLowerCase()} names yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <input
          type="checkbox"
          checked={selectedIds.size > 0 && selectedIds.size === names.length}
          onChange={toggleSelectAll}
          aria-label="Select all"
        />
        <span className="text-sm text-ink-soft">{selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}</span>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="ml-auto flex items-center gap-1 rounded-full border border-no px-3 py-1 text-sm text-no disabled:opacity-50"
          >
            <Trash2 size={14} />
            Delete selected
          </button>
        )}
      </div>
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
              <input
                type="checkbox"
                checked={selectedIds.has(row.id)}
                onChange={() => toggleSelected(row.id)}
                aria-label={`Select ${row.text}`}
              />
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
    </div>
  );
}
