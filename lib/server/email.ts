// Email goes out through Resend's REST API. It's only used for edit links, so a missing key just turns those off.

const apiKey = () => process.env.RESEND_API_KEY;
const from = () => process.env.EMAIL_FROM;

export const emailConfigured = () => Boolean(apiKey() && from());

type Message = { to: string; subject: string; text: string; html: string };

export async function sendEmail(message: Message) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey()}`, "content-type": "application/json" },
    body: JSON.stringify({ from: from(), ...message }),
  });
  if (!response.ok) throw new Error(`Resend replied ${response.status}: ${await response.text()}`);
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

/** The message behind "email me an edit link". */
export function editLinkMessage(url: string, minutes: number): Omit<Message, "to"> {
  const safeUrl = escapeHtml(url);
  return {
    subject: "edit your polaroid · mac cs ’30",
    text: [
      "here’s the link to edit your polaroid:",
      url,
      "",
      `it works once and expires in ${minutes} minutes.`,
      "if you didn’t ask for this, you can ignore it. nothing changes until the link is opened.",
    ].join("\n"),
    html: `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1f1e1b;max-width:520px">
  <p>here’s the link to edit your polaroid:</p>
  <p><a href="${safeUrl}" style="color:#7a1d33">${safeUrl}</a></p>
  <p style="color:#65645e;font-size:14px">it works once and expires in ${minutes} minutes.<br>
  if you didn’t ask for this, you can ignore it. nothing changes until the link is opened.</p>
</div>`,
  };
}
