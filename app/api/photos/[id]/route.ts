import { collections } from "@/lib/server/mongo";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const { photos } = await collections();
  const photo = await photos.findOne({ _id: id });
  if (!photo) return new Response("Not found", { status: 404 });
  // A photo's ID never points at different bytes, so browsers and Vercel's CDN can cache it for a long time.
  return new Response(new Uint8Array(photo.data.buffer), {
    headers: { "content-type": photo.contentType, "cache-control": "public, max-age=2592000, immutable" },
  });
}
