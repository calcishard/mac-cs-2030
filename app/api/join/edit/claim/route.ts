import { z } from "zod";
import { hashEditToken, newEditToken } from "@/lib/server/edit-token";
import { collections } from "@/lib/server/mongo";

// Turns the token from an emailed link into an edit token for this browser. The link stops working once used.

const requestSchema = z.object({ token: z.string().min(1).max(200) });

const fail = (status: number, error: string) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.");
  try {
    const { submissions } = await collections();
    const editToken = newEditToken();
    // Finding the link and replacing the edit token happens in one step, so a second click finds nothing.
    const doc = await submissions.findOneAndUpdate(
      { linkTokenHash: await hashEditToken(parsed.data.token), linkTokenExpiresAt: { $gt: new Date() }, showOnBoard: true },
      { $set: { editTokenHash: await hashEditToken(editToken) }, $unset: { linkTokenHash: "", linkTokenExpiresAt: "" } },
      { projection: { _id: 1 } },
    );
    if (!doc) return fail(404, "that link has expired or was already used. request a new one.");
    return Response.json({ ok: true, editToken }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Could not claim edit link", error);
    return fail(500, "Something went wrong. Please try again.");
  }
}
