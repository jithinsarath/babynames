import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import type { Gender } from "@prisma/client";
import { normalize, type NameCandidate } from "@/lib/nameParsing";

const SUGGESTION_COUNT = 25;

export interface NamePreferences {
  gender: Gender;
  style?: string;
  origin?: string;
  startingLetter?: string;
  syllableCount?: string;
  popularity?: string;
  nicknameFriendly?: boolean;
  theme?: string;
  notes?: string;
}

function buildPreferencesPrompt(prefs: NamePreferences): string {
  const genderLabel = prefs.gender === "BOY" ? "boy" : "girl";
  const lines: string[] = [`Suggest ${SUGGESTION_COUNT} ${genderLabel} baby names based on these preferences:`];
  if (prefs.style) lines.push(`- Style/vibe: ${prefs.style}`);
  if (prefs.origin) lines.push(`- Origin/culture: ${prefs.origin}`);
  if (prefs.startingLetter) lines.push(`- Starts with the letter: ${prefs.startingLetter}`);
  if (prefs.syllableCount) lines.push(`- Syllable count: ${prefs.syllableCount}`);
  if (prefs.popularity) lines.push(`- Popularity level: ${prefs.popularity}`);
  if (prefs.nicknameFriendly) lines.push(`- Should have a natural nickname or short form`);
  if (prefs.theme) lines.push(`- Theme or meaning category: ${prefs.theme}`);
  if (prefs.notes) lines.push(`- Additional notes: ${prefs.notes}`);
  lines.push(
    "",
    "Use real, current information about name meanings, origins, and popularity where it helps — search the web if useful.",
    "",
    `Respond with ONLY a JSON array, no other text, of objects shaped like {"text": "Name", "meaning": "short meaning"}.`,
  );
  return lines.join("\n");
}

function parseCandidates(text: string, existingTexts: string[]): NameCandidate[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Could not find JSON array in AI response");

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) throw new Error("AI response JSON was not an array");

  const seen = new Set(existingTexts.map((t) => normalize(t)));
  const candidates: NameCandidate[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const candidateText = (item as { text?: unknown }).text;
    const meaning = (item as { meaning?: unknown }).meaning;
    if (typeof candidateText !== "string" || !candidateText.trim()) continue;
    const key = normalize(candidateText);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      text: candidateText.trim(),
      meaning: typeof meaning === "string" ? meaning.trim() : undefined,
    });
  }
  return candidates;
}

async function generateWithOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "x-ai/grok-4-fast:free",
      messages: [{ role: "user", content: prompt }],
      plugins: [{ id: "web" }],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("No text response from OpenRouter");
  }
  return text;
}

async function generateWithAnthropic(existingBlock: string, preferencesPrompt: string): Promise<string> {
  const anthropic = new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: existingBlock, cache_control: { type: "ephemeral" } },
          { type: "text", text: preferencesPrompt },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text;
}

export async function generateNamesFromPreferences(prefs: NamePreferences): Promise<NameCandidate[]> {
  const existing = await prisma.name.findMany({
    where: { gender: prefs.gender },
    select: { text: true },
  });
  const existingTexts = existing.map((n) => n.text);

  const existingBlock = `Names already in the list, do not repeat any of these:\n${existingTexts.join(", ") || "(none)"}`;
  const preferencesPrompt = buildPreferencesPrompt(prefs);

  try {
    const text = await generateWithOpenRouter(`${existingBlock}\n\n${preferencesPrompt}`);
    return parseCandidates(text, existingTexts);
  } catch (err) {
    console.error("OpenRouter generation failed, falling back to Anthropic:", err);
  }

  const text = await generateWithAnthropic(existingBlock, preferencesPrompt);
  return parseCandidates(text, existingTexts);
}
