// Someone who adds a polaroid gets a secret token, kept in their browser, that lets them edit it later.
// Only its hash is stored, so reading the database doesn't let anyone edit a card.

export function newEditToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashEditToken(token: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
