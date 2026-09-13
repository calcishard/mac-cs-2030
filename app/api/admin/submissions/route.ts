import { z } from "zod";
import { answersSchema, cardSchema } from "@/lib/join-schema";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { collections, type SubmissionDoc } from "@/lib/server/mongo";

const actionSchema = z.object({
  email: z.string().min(1),
  action: z.enum(["approve", "unapprove", "delete", "edit"]),
  // Only for "edit". Both are checked with the same rules as the join form.
  card: z.unknown().optional(),
  answers: z.unknown().optional(),
});

/** Admins edit the card's words; the photo and its framing stay as submitted. */
const editableCardSchema = cardSchema.omit({ photoPosition: true });
const OPTIONAL_CARD_FIELDS = ["note", "tagline", "bio", "project"] as const;

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

    const set: Partial<SubmissionDoc> = { answers: answers.data };
    // Optional fields an admin blanks out are removed, matching how the join form stores them.
    const unset: Partial<Record<keyof SubmissionDoc, "">> = {};
    let card: z.infer<typeof editableCardSchema> | undefined;
    if (existing.showOnBoard) {
      const result = editableCardSchema.safeParse(parsed.data.card);
      if (!result.success) {
        const issue = result.error.issues[0];
        return Response.json({ error: `${issue.path[0] ?? "card"}: ${issue.message}` }, { status: 400 });
      }
      card = result.data;
      set.name = card.name;
      set.interests = card.interests;
      for (const key of OPTIONAL_CARD_FIELDS) {
        const value = card[key];
        if (value) set[key] = value;
        else unset[key] = "";
      }
    }

    const result = await submissions.updateOne({ _id: email },
      { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
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
