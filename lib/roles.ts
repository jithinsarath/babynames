const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

export function isAllowedVoter(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL;
}

export function isAllowed(email?: string | null): boolean {
  return isAllowedVoter(email) || isAdmin(email);
}
