import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { submissions } from "@/db/schema";
import { emailSchema } from "@/lib/join-schema";

/** Lets the form say an email is taken before someone fills in everything else. */
export async function GET(request: Request) {
  const parsed = emailSchema.safeParse(new URL(request.url).searchParams.get("email") ?? "");
  if (!parsed.success) return Response.json({ error: "Invalid email." }, { status: 400 });
  try {
    const existing = await getDb().select({ email: submissions.email }).from(submissions)
      .where(eq(submissions.email, parsed.data)).get();
    return Response.json({ available: !existing }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Could not check email", error);
    return Response.json({ error: "Could not check that email." }, { status: 500 });
  }
}
