import { emailSchema } from "@/lib/join-schema";
import { collections } from "@/lib/server/mongo";

/** Lets the form say an email is taken before someone fills in everything else. */
export async function GET(request: Request) {
  const parsed = emailSchema.safeParse(new URL(request.url).searchParams.get("email") ?? "");
  if (!parsed.success) return Response.json({ error: "Invalid email." }, { status: 400 });
  try {
    const { submissions } = await collections();
    const existing = await submissions.findOne({ _id: parsed.data }, { projection: { _id: 1 } });
    return Response.json({ available: !existing }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Could not check email", error);
    return Response.json({ error: "Could not check that email." }, { status: 500 });
  }
}
