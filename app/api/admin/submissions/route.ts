import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { photos, submissions } from "@/db/schema";
import { isAdminRequest } from "@/lib/server/admin-auth";

const actionSchema = z.object({
  email: z.string().min(1),
  action: z.enum(["approve", "unapprove", "delete"]),
});

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "Sign in again." }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });
  const { email, action } = parsed.data;

  const db = getDb();
  const row = await db.select({ photoId: submissions.photoId }).from(submissions)
    .where(eq(submissions.email, email)).get();
  if (!row) return Response.json({ error: "That submission no longer exists." }, { status: 404 });

  if (action === "delete") {
    // Deleting frees the email, so its owner can submit again.
    const removeSubmission = db.delete(submissions).where(eq(submissions.email, email));
    if (row.photoId) await db.batch([removeSubmission, db.delete(photos).where(eq(photos.id, row.photoId))]);
    else await removeSubmission;
  } else {
    await db.update(submissions)
      .set(action === "approve"
        ? { status: "approved", approvedAt: new Date().toISOString() }
        : { status: "pending", approvedAt: null })
      .where(eq(submissions.email, email));
  }
  return Response.json({ ok: true });
}
