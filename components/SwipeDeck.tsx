"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { ThumbsUp, HelpCircle, ThumbsDown, RotateCcw } from "lucide-react";
import { castVote } from "@/actions/vote";

type Choice = "YES" | "MAYBE" | "NO";

interface DeckName {
  id: string;
  text: string;
  meaning: string | null;
  currentChoice: string | null;
}

const SWIPE_THRESHOLD = 100;

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
  const firstUndecided = names.findIndex((n) => !n.currentChoice);
  const [index, setIndex] = useState(firstUndecided === -1 ? 0 : firstUndecided);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIndex(firstUndecided === -1 ? 0 : firstUndecided);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names]);

  const current = names[index];
  const upcoming = names[index + 1];

  function decide(choice: Choice) {
    if (!current) return;
    startTransition(() => {
      castVote(current.id, choice, gender.toUpperCase());
    });
    setIndex((i) => i + 1);
  }

  if (!current) {
    return (
      <div className="card-shadow flex flex-col items-center gap-4 rounded-[32px] bg-surface px-6 py-12 text-center">
        <span className="font-display text-2xl font-semibold text-ink">
          You&apos;re all caught up!
        </span>
        <p className="text-sm text-ink-soft">Every name in this list has a vote.</p>
        {index > 0 && (
          <button
            onClick={() => setIndex(0)}
            className="mt-2 flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary"
          >
            <RotateCcw size={16} />
            Review from the start
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
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
        {index + 1} / {names.length} — swipe right for yes, left for no
      </p>
    </div>
  );
}
