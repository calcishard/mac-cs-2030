import { adminConfigured, checkPassword, clearedSessionCookie, sessionCookie } from "@/lib/server/admin-auth";

export async function POST(request: Request) {
  if (!adminConfigured()) return Response.json({ error: "Admin is not set up." }, { status: 503 });
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  if (typeof body?.password !== "string" || !(await checkPassword(body.password))) {
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }
  return new Response(null, { status: 204, headers: { "set-cookie": await sessionCookie(request) } });
}

export async function DELETE() {
  return new Response(null, { status: 204, headers: { "set-cookie": clearedSessionCookie() } });
}
