import { z } from "zod";
import { emailSchema } from "@/lib/join-schema";
import { hashEditToken, newEditToken } from "@/lib/server/edit-token";
import { editLinkMessage, emailConfigured, sendEmail } from "@/lib/server/email";
import { collections } from "@/lib/server/mongo";

// Emails a one-time link that lets someone edit their polaroid from any browser.
// The reply is the same whether or not the email has a polaroid, so nothing is sent for unknown emails.

const LINK_MINUTES = 30;
/** How long to wait before emailing the same address again. Keeps a stuck button from burning the daily quota. */
const RESEND_AFTER_MS = 2 * 60 * 1000;

const requestSchema = z.object({ email: emailSchema });

const fail = (status: number, error: string) => Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
const ok = () => Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "enter your full mac email.");
  if (!emailConfigured()) return fail(503, "edit links aren’t set up yet.");

  try {
    const { submissions } = await collections();
    const now = new Date();
    const token = newEditToken();
    // One update both finds a card worth emailing and records the new link, so two quick requests can't both send.
    const result = await submissions.updateOne(
      {
        _id: parsed.data.email,
        showOnBoard: true,
        $or: [{ linkSentAt: { $exists: false } }, { linkSentAt: { $lt: new Date(now.getTime() - RESEND_AFTER_MS) } }],
      },
      { $set: {
        linkTokenHash: await hashEditToken(token),
        linkTokenExpiresAt: new Date(now.getTime() + LINK_MINUTES * 60 * 1000),
        linkSentAt: now,
      } },
    );
    if (!result.matchedCount) return ok();

    const url = new URL(`/join/edit?token=${token}`, request.url).toString();
    await sendEmail({ to: parsed.data.email, ...editLinkMessage(url, LINK_MINUTES) });
    return ok();
  } catch (error) {
    console.error("Could not send edit link", error);
    return fail(500, "couldn’t send the email. try again in a minute.");
  }
}
