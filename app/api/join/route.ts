import { Buffer } from "node:buffer";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { photos, submissions } from "@/db/schema";
import { MAX_PHOTO_BYTES, sniffImageType } from "@/lib/join-rules";
import { submissionSchema } from "@/lib/join-schema";

const fail = (status: number, error: string, code?: string) => Response.json({ error, code }, { status });
const alreadySubmitted = () => fail(409, "This email has already submitted.", "taken");

function isUniqueViolation(error: unknown) {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  return `${error instanceof Error ? error.message : String(error)} ${cause}`.includes("UNIQUE constraint failed");
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Expected form data.");
  }

  // Real visitors never see this field. Bots that fill it get a quiet success.
  if (form.get("website")) return Response.json({ ok: true }, { status: 201 });

  let payload: unknown = null;
  try {
    payload = JSON.parse(String(form.get("payload") ?? ""));
  } catch {
    // Left as null so validation rejects it.
  }
  const parsed = submissionSchema.safeParse(payload);
  if (!parsed.success) return fail(400, "Some answers are missing or invalid.");
  const submission = parsed.data;

  try {
    const db = getDb();
    const existing = await db.select({ email: submissions.email }).from(submissions)
      .where(eq(submissions.email, submission.email)).get();
    if (existing) return alreadySubmitted();

    const base = { email: submission.email, publicId: crypto.randomUUID(), answers: submission.answers };
    if (!submission.showOnBoard) {
      await db.insert(submissions).values({ ...base, showOnBoard: false });
      return Response.json({ ok: true }, { status: 201 });
    }

    const photo = form.get("photo");
    if (!(photo instanceof File)) return fail(400, "Add a photo of yourself.");
    if (photo.size > MAX_PHOTO_BYTES) return fail(413, "That photo is too large.");
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const contentType = sniffImageType(bytes);
    if (!contentType) return fail(415, "Photos must be JPEG, PNG, or WebP.");

    const photoId = crypto.randomUUID();
    const { card } = submission;
    await db.batch([
      db.insert(photos).values({ id: photoId, contentType, data: Buffer.from(bytes) }),
      db.insert(submissions).values({
        ...base,
        showOnBoard: true,
        name: card.name,
        note: card.note,
        tagline: card.tagline,
        bio: card.bio,
        project: card.project,
        interests: card.interests,
        photoId,
        photoPosition: card.photoPosition,
      }),
    ]);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return alreadySubmitted();
    console.error("Could not save submission", error);
    return fail(500, "Something went wrong saving your answers. Please try again.");
  }
}
