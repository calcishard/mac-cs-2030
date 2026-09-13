import { MongoClient, type Binary, type Db } from "mongodb";
import type { SurveyAnswers } from "@/lib/survey";

export type SubmissionDoc = {
  /** The lowercased email. Using it as the ID makes a second submission from the same email fail. */
  _id: string;
  /** The ID visitors see, so the board never exposes emails. */
  publicId: string;
  status: "pending" | "approved";
  showOnBoard: boolean;
  // Card fields are absent when someone opts out of the board.
  name?: string;
  note?: string;
  tagline?: string;
  bio?: string;
  project?: string;
  interests?: string[];
  photoId?: string;
  photoPosition?: string;
  /** Hash of the token that lets the person who added this card edit it. */
  editTokenHash?: string;
  answers: Partial<SurveyAnswers>;
  createdAt: Date;
  approvedAt: Date | null;
};

/** Photos live apart from submissions so listing submissions never loads image bytes. */
export type PhotoDoc = { _id: string; contentType: string; data: Binary; createdAt: Date };

// One connection per server instance, reused across requests and dev reloads.
const cache = globalThis as typeof globalThis & { macCsDb?: Promise<Db> };

async function connect(uri: string) {
  // ignoreUndefined leaves skipped optional fields out of documents instead of storing null.
  const client = await new MongoClient(uri, { maxPoolSize: 10, ignoreUndefined: true }).connect();
  const db = client.db(process.env.MONGODB_DB || "mac-cs-2030");
  const submissions = db.collection<SubmissionDoc>("submissions");
  await Promise.all([
    submissions.createIndex({ publicId: 1 }, { unique: true }),
    submissions.createIndex({ status: 1, createdAt: -1 }),
    // Sparse, since cards added before editing existed have no token.
    submissions.createIndex({ editTokenHash: 1 }, { unique: true, sparse: true }),
  ]);
  return db;
}

function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local locally, or to the Vercel project's environment variables.");
  cache.macCsDb ??= connect(uri).catch(error => {
    // Let the next request try again instead of caching the failure.
    cache.macCsDb = undefined;
    throw error;
  });
  return cache.macCsDb;
}

export async function collections() {
  const db = await getDb();
  return {
    submissions: db.collection<SubmissionDoc>("submissions"),
    photos: db.collection<PhotoDoc>("photos"),
  };
}

export const isDuplicateKey = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;
