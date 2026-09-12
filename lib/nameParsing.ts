const STOPWORDS = new Set([
  "home", "menu", "about", "contact", "search", "login", "sign up", "signup",
  "subscribe", "share", "comment", "comments", "like", "likes", "follow",
  "followers", "advertisement", "sponsored", "copyright", "privacy policy",
  "terms", "read more", "click here", "reels", "story", "stories", "posted",
  "views", "reply", "replies", "download", "app", "watch", "trending",
]);

const NAME_SHAPE = /^[A-Za-z][A-Za-z'-]*(\s[A-Za-z][A-Za-z'-]*)?$/;

export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/^(mr|mrs|ms|dr|baby|name)\.?\s+/i, "")
    .replace(/[^a-z\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripNoise(token: string): string {
  return token
    .trim()
    .replace(/^\d+[.)]\s*/, "") // leading list numbering
    .replace(/^[•\-*]\s*/, "") // leading bullet
    .replace(/#\S+/g, "") // hashtags
    .replace(/@\S+/g, "") // mentions
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "") // emoji
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim();
}

function isValidName(cleaned: string): boolean {
  if (!cleaned) return false;
  if (cleaned.length > 30) return false;
  if (/\d/.test(cleaned)) return false;
  if (cleaned.split(/\s+/).length > 2) return false;
  if (STOPWORDS.has(cleaned.toLowerCase())) return false;
  if (!NAME_SHAPE.test(cleaned)) return false;
  return true;
}

export interface NameCandidate {
  text: string;
  meaning?: string;
}

export interface ExtractResult {
  candidates: NameCandidate[]; // display text, deduped within batch, in first-seen order
}

export function extractCandidateNames(raw: string): ExtractResult {
  const lines = raw.split(/\n+/);
  const seen = new Set<string>();
  const candidates: NameCandidate[] = [];

  function tryAdd(name: string, meaning?: string) {
    const cleanedName = stripNoise(name);
    if (!isValidName(cleanedName)) return;
    const key = normalize(cleanedName);
    if (!key || seen.has(key)) return;
    const cleanedMeaning = meaning ? stripNoise(meaning) : undefined;
    seen.add(key);
    candidates.push({ text: cleanedName, meaning: cleanedMeaning || undefined });
  }

  for (const line of lines) {
    if (line.includes("|")) {
      const [namePart, ...rest] = line.split("|");
      tryAdd(namePart, rest.join("|"));
      continue;
    }

    for (const token of line.split(/[,;•]+/)) {
      tryAdd(token);
    }
  }

  return { candidates };
}
