"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { ThumbsUp, HelpCircle, ThumbsDown, RotateCcw, Search, X } from "lucide-react";
import { castVote } from "@/actions/vote";

type Choice = "YES" | "MAYBE" | "NO";

interface DeckName {
  id: string;
  text: string;
  meaning: string | null;
  currentChoice: string | null;
}

const SWIPE_THRESHOLD = 100;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function Card({
  name,
  onDecide,
  isTop,
}: {
  name: DeckName;
  onDecide: (choice: Choice) => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const yesOpacity = useTransform(x, [20, 120], [0, 1]);
  const noOpacity = useTransform(x, [-120, -20], [1, 0]);

  return (
    <motion.div
      className="card-shadow absolute inset-0 flex flex-col items-center justify-center rounded-[32px] bg-surface"
      style={{ x, rotate }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) onDecide("YES");
        else if (info.offset.x < -SWIPE_THRESHOLD) onDecide("NO");
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        x: x.get() > 0 ? 300 : x.get() < 0 ? -300 : 0,
        opacity: 0,
        transition: { duration: 0.25 },
      }}
    >
      <motion.span
        style={{ opacity: yesOpacity }}
        className="absolute left-6 top-6 rounded-full bg-yes px-4 py-1.5 text-sm font-bold text-on-yes"
      >
        Yes
      </motion.span>
      <motion.span
        style={{ opacity: noOpacity }}
        className="absolute right-6 top-6 rounded-full bg-no px-4 py-1.5 text-sm font-bold text-on-no"
      >
        No
      </motion.span>

      <span className="font-display text-4xl font-semibold text-ink">{name.text}</span>
      {name.meaning && (
        <span className="mt-2 px-6 text-center text-sm text-ink-soft">{name.meaning}</span>
      )}
      {name.currentChoice && (
        <span className="mt-3 text-xs font-semibold text-ink-soft">
          currently: {name.currentChoice.toLowerCase()}
        </span>
      )}
    </motion.div>
  );
}

export function SwipeDeck({
  names,
  gender,
}: {
  names: DeckName[];
  gender: "boy" | "girl";
}) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Reshuffle only when the underlying name set changes (admin added names),
  // not on every re-fetch after a vote. Adjusting state during render (rather
  // than in an effect) avoids an extra commit + cascading re-render.
  const idsKey = names
    .map((n) => n.id)
    .slice()
    .sort()
    .join(",");
  const [order, setOrder] = useState(() => shuffle(names.map((n) => n.id)));
  const [lastIdsKey, setLastIdsKey] = useState(idsKey);
  if (idsKey !== lastIdsKey) {
    setLastIdsKey(idsKey);
    setOrder(shuffle(names.map((n) => n.id)));
  }

  const byId = useMemo(() => new Map(names.map((n) => [n.id, n])), [names]);
  const orderedNames = useMemo(
    () => order.map((id) => byId.get(id)).filter((n): n is DeckName => !!n),
    [order, byId],
  );

  const activeNames = useMemo(() => {
    if (!search.trim()) return orderedNames;
    const q = search.trim().toLowerCase();
    return orderedNames.filter((n) => n.text.toLowerCase().includes(q));
  }, [orderedNames, search]);

  // Same render-time-adjustment pattern for the current card index: reset it
  // whenever the vote data or the active search term changes.
  const votesKey = names.map((n) => `${n.id}:${n.currentChoice ?? ""}`).join(",");
  const resetSignature = search.trim() ? `search:${search}` : `browse:${votesKey}`;
  const [index, setIndex] = useState(0);
  const [lastResetSignature, setLastResetSignature] = useState(resetSignature);
  if (resetSignature !== lastResetSignature) {
    setLastResetSignature(resetSignature);
    if (search.trim()) {
      setIndex(0);
    } else {
      const firstUndecided = orderedNames.findIndex((n) => !n.currentChoice);
      setIndex(firstUndecided === -1 ? 0 : firstUndecided);
    }
  }

  const current = activeNames[index];
  const upcoming = activeNames[index + 1];

  // Timestamp the moment each card becomes the top card, so we can measure
  // how long the user spent looking at it before deciding.
  const shownAtRef = useRef(Date.now());
  useEffect(() => {
    shownAtRef.current = Date.now();
  }, [current?.id]);

  function decide(choice: Choice) {
    if (!current) return;
    const decisionMs = Date.now() - shownAtRef.current;
    startTransition(() => {
      castVote(current.id, choice, gender.toUpperCase(), decisionMs, index, !!search.trim());
    });
    setIndex((i) => i + 1);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search names..."
          className="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-9 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {current ? (
        <>
          <div className="relative h-72 w-full max-w-sm">
            {upcoming && (
              <div className="card-shadow absolute inset-x-3 inset-y-2 rounded-[32px] bg-surface opacity-60" />
            )}
            <AnimatePresence>
              <Card key={current.id} name={current} onDecide={decide} isTop />
            </AnimatePresence>
          </div>

          <div className="flex w-full max-w-sm gap-2">
            <button
              disabled={isPending}
              onClick={() => decide("NO")}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-no/30 bg-no/10 py-3 text-sm font-bold text-ink disabled:opacity-50"
            >
              <ThumbsDown size={18} />
              No
            </button>
            <button
              disabled={isPending}
              onClick={() => decide("MAYBE")}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-secondary/40 bg-secondary/15 py-3 text-sm font-bold text-ink disabled:opacity-50"
            >
              <HelpCircle size={18} />
              Maybe
            </button>
            <button
              disabled={isPending}
              onClick={() => decide("YES")}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-yes/40 bg-yes/15 py-3 text-sm font-bold text-ink disabled:opacity-50"
            >
              <ThumbsUp size={18} />
              Yes
            </button>
          </div>

          <p className="text-xs font-semibold text-ink-soft">
            {index + 1} / {activeNames.length}
            {search ? " matches" : " — swipe right for yes, left for no"}
          </p>
        </>
      ) : (
        <div className="card-shadow flex flex-col items-center gap-4 rounded-[32px] bg-surface px-6 py-12 text-center">
          {!search && (
            <Image
              src="/mascot.png"
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 rounded-full"
            />
          )}
          <span className="font-display text-2xl font-semibold text-ink">
            {search ? "No names match" : "You're all caught up!"}
          </span>
          <p className="text-sm text-ink-soft">
            {search ? "Try a different search." : "Every name in this list has a vote."}
          </p>
          {!search && (
            <button
              onClick={() => setIndex(0)}
              className="mt-2 flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
            >
              <RotateCcw size={16} />
              Review from the start
            </button>
          )}
        </div>
      )}
    </div>
  );
}
