import { Binary } from "mongodb";
import { MAX_PHOTO_BYTES, sniffImageType } from "@/lib/join-rules";
import { submissionSchema } from "@/lib/join-schema";
import { hashEditToken, newEditToken } from "@/lib/server/edit-token";
import { collections, isDuplicateKey } from "@/lib/server/mongo";

const fail = (status: number, error: string, code?: string) => Response.json({ error, code }, { status });
const alreadySubmitted = () => fail(409, "This email has already submitted.", "taken");

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
    const { submissions, photos } = await collections();
    if (await submissions.findOne({ _id: submission.email }, { projection: { _id: 1 } })) return alreadySubmitted();

    const base = {
      _id: submission.email,
      publicId: crypto.randomUUID(),
      status: "pending" as const,
      answers: submission.answers,
      createdAt: new Date(),
      approvedAt: null,
    };
    if (!submission.showOnBoard) {
      await submissions.insertOne({ ...base, showOnBoard: false });
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
    const editToken = newEditToken();
    await photos.insertOne({ _id: photoId, contentType, data: new Binary(bytes), createdAt: new Date() });
    try {
      await submissions.insertOne({ ...base, showOnBoard: true, ...card, photoId, editTokenHash: await hashEditToken(editToken) });
    } catch (error) {
      // Don't leave an orphaned photo behind, for example when the same email submits twice at once.
      await photos.deleteOne({ _id: photoId });
      throw error;
    }
    return Response.json({ ok: true, editToken }, { status: 201 });
  } catch (error) {
    if (isDuplicateKey(error)) return alreadySubmitted();
    console.error("Could not save submission", error);
    return fail(500, "Something went wrong saving your answers. Please try again.");
  }
}
