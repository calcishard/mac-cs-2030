import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { submissions } from "@/db/schema";
import type { AdminEntry, Person } from "@/lib/class-profile";
import { summarize, type SurveySummary } from "@/lib/survey";

type Row = typeof submissions.$inferSelect;

// Background and text colours for the initials shown if a photo fails to load.
const palette = [
  ["#e7b345", "#4a231c"], ["#c2cedb", "#263b53"], ["#d9cde1", "#52365e"],
  ["#accabf", "#234a3c"], ["#c57866", "#401e1c"], ["#d7d4a8", "#45451f"],
] as const;

export const photoUrl = (id: string) => `/api/photos/${id}`;

function hash(text: string) {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value;
}

function shuffle<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function toPerson(row: Row): Person {
  const name = row.name ?? "";
  const [color, ink] = palette[hash(row.publicId) % palette.length];
  return {
    id: row.publicId,
    name,
    initials: name.split(" ").map(word => word.charAt(0)).join("").toLowerCase(),
    tagline: row.tagline ?? "",
    color,
    ink,
    bio: row.bio ?? "",
    project: row.project ?? "",
    interests: row.interests ?? [],
    photo: row.photoId ? photoUrl(row.photoId) : undefined,
    photoAlt: `Photo of ${name}`,
    photoPosition: row.photoPosition ?? undefined,
    note: row.note ?? undefined,
  };
}

/** Approved polaroids for the board, plus chart numbers from approved answers. */
export async function getHomeData(): Promise<{ people: Person[]; survey: SurveySummary }> {
  try {
    const rows = await getDb().select().from(submissions).where(eq(submissions.status, "approved"));
    const people = shuffle(rows.filter(row => row.showOnBoard && row.name && row.photoId)).map(toPerson);
    return { people, survey: summarize(rows.map(row => row.answers)) };
  } catch (error) {
    console.error("Could not load approved submissions", error);
    return { people: [], survey: summarize([]) };
  }
}

export async function listSubmissions(): Promise<AdminEntry[]> {
  const rows = await getDb().select().from(submissions).orderBy(desc(submissions.createdAt));
  return rows.map(row => ({
    email: row.email,
    status: row.status,
    showOnBoard: row.showOnBoard,
    name: row.name,
    note: row.note,
    tagline: row.tagline,
    bio: row.bio,
    project: row.project,
    interests: row.interests ?? [],
    photo: row.photoId ? photoUrl(row.photoId) : undefined,
    photoPosition: row.photoPosition,
    createdAt: row.createdAt,
  }));
}
