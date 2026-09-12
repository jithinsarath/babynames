"use client";

import { useState, useTransition } from "react";
import { setRanking } from "@/actions/rank";

export function RankingSlider({
  nameId,
  gender,
  initialScore,
}: {
  nameId: string;
  gender: "boy" | "girl";
  initialScore: number | null;
}) {
  const [score, setScore] = useState(initialScore ?? 5);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={1}
        max={10}
        value={score}
        disabled={isPending}
        onChange={(e) => {
          const next = Number(e.target.value);
          setScore(next);
          startTransition(() => {
            setRanking(nameId, next, gender.toUpperCase());
          });
        }}
        className="kp-slider flex-1"
      />
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
        {score}
      </span>
    </div>
  );
}
