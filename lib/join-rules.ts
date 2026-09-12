// Rules shared by the join form, its API routes, and the tests.
// No imports, so Node can load this file directly.

export const LIMITS = {
  note: 40,
  tagline: 50,
  bio: 300,
  project: 80,
  interest: 24,
  interestsMax: 5,
} as const;

export const MAX_PHOTO_BYTES = 1_000_000;
/** Only the shape is checked. Admins confirm the address really is a McMaster one. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_PATTERN = /^\p{Lu}[\p{L}'’-]*(?: \p{Lu}[\p{L}'’-]*)* \p{Lu}\.$/u;
export const PHOTO_POSITION_PATTERN = /^(?:100|\d{1,2})% (?:100|\d{1,2})%$/;

/** "  SmithJ12@McMaster.ca " → "smithj12@mcmaster.ca" */
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

/** Keeps line breaks, but "\r\n" → "\n", no trailing spaces, and at most one blank line in a row. */
export const normalizeMultiline = (value: string) =>
  value.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();

const capitalize = (word: string) => word.charAt(0).toLocaleUpperCase() + word.slice(1);

/** "jason tran" → "Jason T.", "mary ann s" → "Mary Ann S." */
export function formatName(value: string) {
  const words = value.trim().replace(/\.$/, "").split(/\s+/).filter(Boolean);
  if (words.length < 2) return words.map(capitalize).join(" ");
  const last = words.pop()!;
  return [...words.map(capitalize), last.charAt(0).toLocaleUpperCase() + "."].join(" ");
}

/** Identifies an upload by its first bytes rather than trusting the browser's label. */
export function sniffImageType(bytes: Uint8Array): "image/webp" | "image/jpeg" | "image/png" | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  return null;
}
