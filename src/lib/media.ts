// Media lives on Cloudinary (unsigned preset); the database stores only the URL.
// Older reports may still hold internal storage paths, which remain readable.
export const CLOUDINARY_CLOUD = "oezaiw9s";
export const CLOUDINARY_PRESET = "uitm_preset";
export const MAX_DIMENSION = 500;
export const WEBP_QUALITY = 0.6;

export function isExternalPhoto(path: string | null | undefined): boolean {
  return !!path && /^https?:\/\//i.test(path.trim());
}

export function fitWithin(w: number, h: number, max = MAX_DIMENSION) {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", WEBP_QUALITY));
  if (!blob) throw new Error("Foto gagal dimampatkan.");
  return blob;
}

export async function uploadPhoto(file: File): Promise<string> {
  const blob = await compressImage(file);
  const form = new FormData();
  form.append("file", blob, "laporan.webp");
  form.append("upload_preset", CLOUDINARY_PRESET);
  form.append("folder", "uitm-sitewatch");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !json.secure_url) throw new Error(`Muat naik foto gagal: ${json.error?.message ?? res.status}`);
  return json.secure_url;
}
