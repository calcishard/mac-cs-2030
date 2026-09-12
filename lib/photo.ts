import { MAX_PHOTO_BYTES } from "@/lib/join-rules";

const MAX_SOURCE_BYTES = 30_000_000;
// Longest edge and quality to try, from sharpest to smallest.
const ATTEMPTS = [[1400, 0.86], [1200, 0.8], [1000, 0.74], [800, 0.7]] as const;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
}

/** Shrinks a photo in the browser before upload. The whole frame is kept; the card crops with object-position. */
export async function preparePhoto(file: File): Promise<Blob> {
  if (file.type && !file.type.startsWith("image/")) throw new Error("that file isn’t an image.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("that photo is huge. try one under 30 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error("couldn’t open that photo. try a jpg or png.");
    }
    for (const [edge, quality] of ATTEMPTS) {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) break;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let blob = await toBlob(canvas, "image/webp", quality);
      // Browsers that cannot encode WebP quietly return PNG instead.
      if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
      if (blob && blob.size <= MAX_PHOTO_BYTES) return blob;
    }
    throw new Error("couldn’t shrink that photo enough. try a different one.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
