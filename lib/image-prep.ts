/** Pictures wider than this are shrunk before upload so the project page stays fast. */
export const GALLERY_MAX_WIDTH = 2400;
const KEEP_AS_IS_BYTES = 3 * 1024 * 1024;

/** The size a picture should have so it is at most maxWidth wide, keeping its shape. */
export function fitWithin(width: number, height: number, maxWidth: number) {
  if (width <= maxWidth) return { width, height };
  return { width: maxWidth, height: Math.max(1, Math.round((height * maxWidth) / width)) };
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image. Try a JPG, PNG or WebP file."));
    };
    img.src = url;
  });
}

/**
 * Gets a picture ready for the project page. Small pictures go up untouched.
 * Very wide or very heavy ones are shrunk to at most 2400 px wide.
 * GIFs and SVGs are never touched, so animation and sharpness stay.
 */
export async function prepareGalleryImage(file: File): Promise<File> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;
  if (!w || !h) throw new Error("Couldn't read that image. Try a JPG, PNG or WebP file.");
  if (w <= GALLERY_MAX_WIDTH && file.size <= KEEP_AS_IS_BYTES) return file;

  const size = fitWithin(w, h, GALLERY_MAX_WIDTH);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.fillStyle = '#ffffff'; // behind see-through PNGs, since JPEG has no transparency
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, size.width, size.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) return file;
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
