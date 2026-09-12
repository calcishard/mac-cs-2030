import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { photos } from "@/db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const photo = await getDb().select({ contentType: photos.contentType, data: photos.data }).from(photos)
    .where(eq(photos.id, id)).get();
  if (!photo) return new Response("Not found", { status: 404 });
  // A photo's ID never points at different bytes, so browsers can cache it for a long time.
  return new Response(new Uint8Array(photo.data), {
    headers: { "content-type": photo.contentType, "cache-control": "public, max-age=2592000, immutable" },
  });
}
