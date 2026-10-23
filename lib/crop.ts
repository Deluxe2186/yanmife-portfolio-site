/**
 * Maths for the image cropper. Everything here works in the photo's own
 * pixels, so it does not depend on how big the picture looks on screen.
 *
 * A crop is a rectangle with a fixed shape (for example 4:3). It is stored as
 * its top-left corner and its width. The height always follows from the width.
 */

export interface CropRect {
  x: number;
  y: number;
  w: number;
}

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export const rectHeight = (rect: CropRect, aspect: number) => rect.w / aspect;

/** The widest crop that still fits inside the photo. */
export function maxWidth(imgW: number, imgH: number, aspect: number): number {
  return Math.min(imgW, imgH * aspect);
}

/** The smallest crop allowed (8 times zoomed in, and never under 64 pixels). */
export function minWidth(imgW: number, imgH: number, aspect: number): number {
  const max = maxWidth(imgW, imgH, aspect);
  return Math.min(max, Math.max(max / 8, 64));
}

/** Keeps a crop inside the photo and inside the allowed size range. */
export function clampRect(rect: CropRect, imgW: number, imgH: number, aspect: number): CropRect {
  const w = clamp(rect.w, minWidth(imgW, imgH, aspect), maxWidth(imgW, imgH, aspect));
  const h = w / aspect;
  return {
    w,
    x: clamp(rect.x, 0, imgW - w),
    y: clamp(rect.y, 0, imgH - h),
  };
}

/** A centred crop. fraction 1 is the biggest possible, 0.9 leaves a small margin. */
export function initialRect(imgW: number, imgH: number, aspect: number, fraction = 1): CropRect {
  const w = maxWidth(imgW, imgH, aspect) * fraction;
  const h = w / aspect;
  return clampRect({ x: (imgW - w) / 2, y: (imgH - h) / 2, w }, imgW, imgH, aspect);
}

/** 1 means the whole photo fits. 2 means the crop is half as wide, and so on. */
export function zoomLevel(rect: CropRect, imgW: number, imgH: number, aspect: number): number {
  return maxWidth(imgW, imgH, aspect) / rect.w;
}

/** Zooms to an exact level, keeping the centre of the crop where it is. */
export function zoomTo(
  rect: CropRect,
  level: number,
  imgW: number,
  imgH: number,
  aspect: number
): CropRect {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rectHeight(rect, aspect) / 2;
  const w = maxWidth(imgW, imgH, aspect) / level;
  const h = w / aspect;
  return clampRect({ x: cx - w / 2, y: cy - h / 2, w }, imgW, imgH, aspect);
}

/** Zooms by a factor. A factor above 1 zooms in (a smaller crop). */
export function zoomBy(
  rect: CropRect,
  factor: number,
  imgW: number,
  imgH: number,
  aspect: number
): CropRect {
  return zoomTo(rect, zoomLevel(rect, imgW, imgH, aspect) * factor, imgW, imgH, aspect);
}

export function moveRect(
  rect: CropRect,
  dx: number,
  dy: number,
  imgW: number,
  imgH: number,
  aspect: number
): CropRect {
  return clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, imgW, imgH, aspect);
}

/** Where a corner of the crop sits, in photo pixels. */
export function cornerPoint(rect: CropRect, corner: Corner, aspect: number) {
  const h = rectHeight(rect, aspect);
  return {
    x: corner === 'nw' || corner === 'sw' ? rect.x : rect.x + rect.w,
    y: corner === 'nw' || corner === 'ne' ? rect.y : rect.y + h,
  };
}

/**
 * Drags one corner to (px, py). The opposite corner stays where it is and the
 * shape stays the same. The crop cannot leave the photo.
 */
export function resizeFromCorner(
  start: CropRect,
  corner: Corner,
  px: number,
  py: number,
  imgW: number,
  imgH: number,
  aspect: number
): CropRect {
  const h = rectHeight(start, aspect);
  const sx = corner === 'ne' || corner === 'se' ? 1 : -1; // dragged corner is right (+1) or left (-1)
  const sy = corner === 'sw' || corner === 'se' ? 1 : -1; // dragged corner is bottom (+1) or top (-1)
  const ax = sx > 0 ? start.x : start.x + start.w; // fixed corner
  const ay = sy > 0 ? start.y : start.y + h;

  const fromX = (px - ax) * sx;
  const fromY = (py - ay) * sy * aspect;
  const roomX = sx > 0 ? imgW - ax : ax;
  const roomY = sy > 0 ? imgH - ay : ay;
  const biggest = Math.min(roomX, roomY * aspect, maxWidth(imgW, imgH, aspect));
  const smallest = Math.min(biggest, minWidth(imgW, imgH, aspect));
  const w = clamp(Math.max(fromX, fromY), smallest, biggest);

  return {
    w,
    x: sx > 0 ? ax : ax - w,
    y: sy > 0 ? ay : ay - w / aspect,
  };
}

/** Draws the chosen part of the photo into a canvas of the final size. */
export function drawCrop(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  rect: CropRect,
  aspect: number,
  outW: number,
  outH: number
) {
  ctx.fillStyle = '#ffffff'; // behind see-through PNGs, since JPEG has no transparency
  ctx.fillRect(0, 0, outW, outH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, rect.x, rect.y, rect.w, rectHeight(rect, aspect), 0, 0, outW, outH);
}

/** Cuts the chosen part out of the photo and returns it as a JPEG of the exact final size. */
export function cropToBlob(
  img: CanvasImageSource,
  rect: CropRect,
  aspect: number,
  outW: number,
  outH: number,
  quality = 0.88
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Your browser cannot edit images.'));
  drawCrop(ctx, img, rect, aspect, outW, outH);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))),
      'image/jpeg',
      quality
    );
  });
}
