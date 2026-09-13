import { z } from "zod";
import { answersSchema, cardSchema } from "@/lib/join-schema";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { cardUpdate } from "@/lib/server/card-update";
import { collections } from "@/lib/server/mongo";

const actionSchema = z.object({
  email: z.string().min(1),
  action: z.enum(["approve", "unapprove", "delete", "edit"]),
  // Only for "edit". Both are checked with the same rules as the join form.
  card: z.unknown().optional(),
  answers: z.unknown().optional(),
});

/** Admins edit the card's words; the photo and its framing stay as submitted. */
const editableCardSchema = cardSchema.omit({ photoPosition: true });

const gone = () => Response.json({ error: "That submission no longer exists." }, { status: 404 });

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "Sign in again." }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { email, action } = parsed.data;
  const { submissions, photos } = await collections();

  if (action === "edit") {
    const existing = await submissions.findOne({ _id: email }, { projection: { showOnBoard: 1 } });
    if (!existing) return gone();
    const answers = answersSchema.safeParse(parsed.data.answers);
    if (!answers.success) return Response.json({ error: "Invalid survey answers." }, { status: 400 });

    let card: z.infer<typeof editableCardSchema> | undefined;
    if (existing.showOnBoard) {
      const result = editableCardSchema.safeParse(parsed.data.card);
      if (!result.success) {
        const issue = result.error.issues[0];
        return Response.json({ error: `${issue.path[0] ?? "card"}: ${issue.message}` }, { status: 400 });
      }
      card = result.data;
    }

    const result = await submissions.updateOne({ _id: email },
      card ? cardUpdate(card, { answers: answers.data }) : { $set: { answers: answers.data } });
    if (!result.matchedCount) return gone();
    return Response.json({ ok: true, card, answers: answers.data });
  }

  if (action === "delete") {
    // Deleting frees the email, so its owner can submit again.
    const removed = await submissions.findOneAndDelete({ _id: email });
    if (!removed) return gone();
    if (removed.photoId) await photos.deleteOne({ _id: removed.photoId });
  } else {
    const result = await submissions.updateOne({ _id: email }, {
      $set: action === "approve" ? { status: "approved", approvedAt: new Date() } : { status: "pending", approvedAt: null },
    });
    if (!result.matchedCount) return gone();
  }
  return Response.json({ ok: true });
}
