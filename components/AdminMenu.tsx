"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AdminLink = { href: string; label: string; Icon: LucideIcon };

export function AdminMenu({ links, hasBadge }: { links: AdminLink[]; hasBadge: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex flex-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-1 flex-col items-center gap-1 rounded-3xl py-2.5 text-ink-soft active:bg-primary/15 active:text-primary"
      >
        <span className="relative">
          <Shield size={20} strokeWidth={2.25} />
          {hasBadge && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </span>
        <span className="text-[11px] font-bold">Admin</span>
      </button>

      {open && (
        <div className="card-shadow-lg absolute bottom-full left-1/2 mb-2 flex w-48 -translate-x-1/2 flex-col gap-1 rounded-2xl bg-surface p-1.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-ink-soft active:bg-primary/15 active:text-primary"
            >
              <link.Icon size={16} strokeWidth={2.25} />
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
