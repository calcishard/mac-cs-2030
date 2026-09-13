import type { AdminEntry, Person } from "@/lib/class-profile";
import { collections, type SubmissionDoc } from "@/lib/server/mongo";
import { summarize, type SurveySummary } from "@/lib/survey";

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

function toPerson(doc: SubmissionDoc): Person {
  const name = doc.name ?? "";
  const [color, ink] = palette[hash(doc.publicId) % palette.length];
  return {
    id: doc.publicId,
    name,
    initials: name.split(" ").map(word => word.charAt(0)).join("").toLowerCase(),
    tagline: doc.tagline ?? "",
    color,
    ink,
    bio: doc.bio ?? "",
    project: doc.project ?? "",
    interests: doc.interests ?? [],
    photo: doc.photoId ? photoUrl(doc.photoId) : undefined,
    photoAlt: `Photo of ${name}`,
    photoPosition: doc.photoPosition,
    note: doc.note,
  };
}

/** Approved polaroids for the board, plus chart numbers from approved answers. */
export async function getHomeData(): Promise<{ people: Person[]; survey: SurveySummary }> {
  try {
    const { submissions } = await collections();
    const docs = await submissions.find({ status: "approved" }).toArray();
    const people = shuffle(docs.filter(doc => doc.showOnBoard && doc.name && doc.photoId)).map(toPerson);
    return { people, survey: summarize(docs.map(doc => doc.answers)) };
  } catch (error) {
    console.error("Could not load approved submissions", error);
    return { people: [], survey: summarize([]) };
  }
}

export async function listSubmissions(): Promise<AdminEntry[]> {
  const { submissions } = await collections();
  const docs = await submissions.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(doc => ({
    email: doc._id,
    status: doc.status,
    showOnBoard: doc.showOnBoard,
    name: doc.name ?? null,
    note: doc.note ?? null,
    tagline: doc.tagline ?? null,
    bio: doc.bio ?? null,
    project: doc.project ?? null,
    interests: doc.interests ?? [],
    photo: doc.photoId ? photoUrl(doc.photoId) : undefined,
    photoPosition: doc.photoPosition ?? null,
    answers: doc.answers ?? {},
    createdAt: doc.createdAt.toISOString(),
  }));
}
