import { z } from "zod";
import { isAdminRequest } from "@/lib/server/admin-auth";
import { collections } from "@/lib/server/mongo";

const actionSchema = z.object({
  email: z.string().min(1),
  action: z.enum(["approve", "unapprove", "delete"]),
});

const gone = () => Response.json({ error: "That submission no longer exists." }, { status: 404 });

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "Sign in again." }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { email, action } = parsed.data;
  const { submissions, photos } = await collections();

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
