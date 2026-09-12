import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import type { Gender } from "@prisma/client";
import { normalize, type NameCandidate } from "@/lib/nameParsing";

const TOP_RANKED_COUNT = 20;
const SUGGESTION_COUNT = 25;

export async function suggestNamesFromRankings(gender: Gender): Promise<NameCandidate[]> {
  const topRanked = await prisma.ranking.groupBy({
    by: ["nameId"],
    where: { name: { gender } },
    _avg: { score: true },
    orderBy: { _avg: { score: "desc" } },
    take: TOP_RANKED_COUNT,
  });

  const allNames = await prisma.name.findMany({
    where: { gender },
    select: { id: true, text: true, normalizedText: true },
  });
  const nameById = new Map(allNames.map((n) => [n.id, n.text]));
  const existingTexts = allNames.map((n) => n.text);

  const topNames = topRanked
    .map((r) => nameById.get(r.nameId))
    .filter((text): text is string => !!text);

  const seedList = topNames.length > 0 ? topNames : existingTexts.slice(0, TOP_RANKED_COUNT);
  if (seedList.length === 0) {
    throw new Error("No names to base suggestions on yet");
  }

  const anthropic = new Anthropic();
  const genderLabel = gender === "BOY" ? "boy" : "girl";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content:
          `Here are ${genderLabel} baby names this family likes, roughly in order of preference:\n` +
          seedList.join(", ") +
          `\n\nSuggest ${SUGGESTION_COUNT} additional ${genderLabel} names that fit the same style ` +
          `(mix of names similar to the favorites and other names worth considering). ` +
          `Do not repeat any name already listed here: ${existingTexts.join(", ") || "(none)"}.\n\n` +
          `Respond with ONLY a JSON array, no other text, of objects shaped like ` +
          `{"text": "Name", "meaning": "short meaning"}.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not find JSON array in Claude response");
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) {
    throw new Error("Claude response JSON was not an array");
  }

  const seen = new Set(existingTexts.map((t) => normalize(t)));
  const candidates: NameCandidate[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const text = (item as { text?: unknown }).text;
    const meaning = (item as { meaning?: unknown }).meaning;
    if (typeof text !== "string" || !text.trim()) continue;
    const key = normalize(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    candidates.push({ text: text.trim(), meaning: typeof meaning === "string" ? meaning.trim() : undefined });
  }

  return candidates;
}
