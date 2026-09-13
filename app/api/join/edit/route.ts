import { z } from "zod";
import { cardSchema } from "@/lib/join-schema";
import { cardUpdate } from "@/lib/server/card-update";
import { hashEditToken } from "@/lib/server/edit-token";
import { collections } from "@/lib/server/mongo";
import { photoUrl } from "@/lib/server/queries";

// The person who added a polaroid can change its words and photo framing, but not the photo or their email.

const requestSchema = z.object({ token: z.string().min(1).max(200), card: z.unknown().optional() });

const fail = (status: number, error: string) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
const gone = () => fail(404, "That polaroid can’t be edited from here anymore.");

async function readRequest(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  return parsed.success ? { ...parsed.data, filter: { editTokenHash: await hashEditToken(parsed.data.token), showOnBoard: true } } : null;
}

/** Loads the polaroid to edit. */
export async function POST(request: Request) {
  const input = await readRequest(request);
  if (!input) return fail(400, "Invalid request.");
  try {
    const { submissions } = await collections();
    const doc = await submissions.findOne(input.filter);
    if (!doc) return gone();
    return Response.json({
      card: {
        name: doc.name ?? "",
        note: doc.note ?? "",
        tagline: doc.tagline ?? "",
        bio: doc.bio ?? "",
        project: doc.project ?? "",
        interests: doc.interests ?? [],
        photoPosition: doc.photoPosition ?? "50% 50%",
      },
      photo: doc.photoId ? photoUrl(doc.photoId) : undefined,
      status: doc.status,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Could not load polaroid to edit", error);
    return fail(500, "Something went wrong. Please try again.");
  }
}

/** Saves the changes. An edited card goes back for review before it shows on the board again. */
export async function PATCH(request: Request) {
  const input = await readRequest(request);
  if (!input) return fail(400, "Invalid request.");
  const card = cardSchema.safeParse(input.card);
  if (!card.success) {
    const issue = card.error.issues[0];
    return fail(400, `${issue.path[0] ?? "card"}: ${issue.message}`);
  }
  try {
    const { submissions } = await collections();
    const result = await submissions.updateOne(input.filter,
      cardUpdate(card.data, { photoPosition: card.data.photoPosition, status: "pending", approvedAt: null }));
    if (!result.matchedCount) return gone();
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Could not save polaroid edit", error);
    return fail(500, "Something went wrong saving your changes. Please try again.");
  }
}
