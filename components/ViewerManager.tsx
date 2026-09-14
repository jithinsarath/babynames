"use client";

import { useEffect, useState, useTransition } from "react";
import { UserMinus } from "lucide-react";
import { listViewers, inviteViewer, revokeViewer } from "@/app/admin/actions";

type ViewerRow = { id: string; email: string; name: string | null };

export function ViewerManager() {
  const [viewers, setViewers] = useState<ViewerRow[] | null>(null);
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listViewers().then(setViewers);
  }, []);

  function handleInvite() {
    const trimmed = email.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await inviteViewer(trimmed);
      setViewers(await listViewers());
      setEmail("");
    });
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      await revokeViewer(id);
      setViewers(await listViewers());
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="flex-1 rounded-2xl border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleInvite}
          disabled={isPending || !email.trim()}
          className="card-shadow rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
        >
          Invite
        </button>
      </div>

      {viewers === null ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : viewers.length === 0 ? (
        <p className="text-sm text-ink-soft">No viewers yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {viewers.map((v) => (
            <li key={v.id} className="card-shadow flex items-center gap-2 rounded-2xl bg-surface p-3">
              <div className="flex-1 text-sm text-ink">{v.name ?? v.email}</div>
              <button
                onClick={() => handleRevoke(v.id)}
                disabled={isPending}
                className="rounded-full border border-no p-2 text-no"
                aria-label="Revoke"
              >
                <UserMinus size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
