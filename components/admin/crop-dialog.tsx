'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Minus, Plus, RotateCcw, X } from 'lucide-react';
import {
  clampRect,
  cornerPoint,
  cropToBlob,
  initialRect,
  moveRect,
  rectHeight,
  resizeFromCorner,
  zoomBy,
  zoomLevel,
  zoomTo,
  type Corner,
  type CropRect,
} from '@/lib/crop';
import { Button } from '@/components/ui/button';

interface CropDialogProps {
  file: File;
  /**
   * 'box': the photo stays still and you drag the corners of a box over it.
   * 'frame': the box stays still and you drag the photo behind it.
   */
  variant: 'box' | 'frame';
  /** Width divided by height of the final picture, for example 4 / 3. */
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  title: string;
  help: string;
  onCancel: () => void;
  onDone: (blob: Blob) => void | Promise<void>;
}

const PAD = 14; // room around the photo so the corner handles are easy to grab
const MAX_STAGE_HEIGHT = 440;
const ZOOM_STEP = 1.2;
const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se'];
const CORNER_NAME: Record<Corner, string> = {
  nw: 'top left',
  ne: 'top right',
  sw: 'bottom left',
  se: 'bottom right',
};

type Drag = { kind: 'move' | 'pan' | 'corner'; corner?: Corner; start: CropRect; x: number; y: number };

export function CropDialog({
  file,
  variant,
  aspect,
  outputWidth,
  outputHeight,
  title,
  help,
  onCancel,
  onDone,
}: CropDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [rect, setRect] = useState<CropRect | null>(null);
  const [holderW, setHolderW] = useState(560);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loaderRef = useRef<HTMLImageElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const startFraction = variant === 'box' ? 0.9 : 1;

  // Show the chosen file.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Follow the width of the dialog.
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const measure = () => {
      if (holder.clientWidth > 0) setHolderW(holder.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(holder);
    return () => observer.disconnect();
  }, []);

  // Escape closes only this dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [busy, onCancel]);

  const handleLoad = () => {
    const img = loaderRef.current;
    if (!img || !img.naturalWidth) return;
    const dims = { w: img.naturalWidth, h: img.naturalHeight };
    setSize(dims);
    setRect(initialRect(dims.w, dims.h, aspect, startFraction));
  };

  // ----- geometry on screen -----
  let scale = 1; // screen pixels per photo pixel
  let stageW = 0;
  let stageH = 0;
  let frame = { w: 0, h: 0 };
  if (size) {
    if (variant === 'box') {
      scale = Math.min(Math.max(holderW - PAD * 2, 50) / size.w, MAX_STAGE_HEIGHT / size.h);
      stageW = size.w * scale + PAD * 2;
      stageH = size.h * scale + PAD * 2;
    } else {
      const side = Math.min(holderW, MAX_STAGE_HEIGHT);
      stageW = side;
      stageH = side;
      frame =
        aspect >= 1
          ? { w: side * 0.7, h: (side * 0.7) / aspect }
          : { w: side * 0.7 * aspect, h: side * 0.7 };
      if (rect) scale = frame.w / rect.w;
    }
  }

  const apply = useCallback(
    (next: (r: CropRect, w: number, h: number) => CropRect) => {
      setRect((current) => (current && size ? next(current, size.w, size.h) : current));
    },
    [size]
  );
  const zoom = (factor: number) => apply((r, w, h) => zoomBy(r, factor, w, h, aspect));

  // ----- dragging -----
  const startDrag = (e: React.PointerEvent, kind: Drag['kind'], corner?: Corner) => {
    if (!rect) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { kind, corner, start: rect, x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !size || scale <= 0) return;
    const dx = (e.clientX - d.x) / scale;
    const dy = (e.clientY - d.y) / scale;
    if (d.kind === 'move') setRect(moveRect(d.start, dx, dy, size.w, size.h, aspect));
    else if (d.kind === 'pan') setRect(moveRect(d.start, -dx, -dy, size.w, size.h, aspect));
    else if (d.corner) {
      const from = cornerPoint(d.start, d.corner, aspect);
      setRect(resizeFromCorner(d.start, d.corner, from.x + dx, from.y + dy, size.w, size.h, aspect));
    }
  };
  const endDrag = () => {
    drag.current = null;
  };

  // Mouse wheel zooms (needs a non-passive listener so the page does not scroll).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom(Math.exp(-e.deltaY * 0.0015));
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, variant]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!rect) return;
    const step = rect.w * 0.03;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      apply((r, w, h) => moveRect(r, moves[e.key][0], moves[e.key][1], w, h, aspect));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoom(ZOOM_STEP);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoom(1 / ZOOM_STEP);
    }
  };

  const reset = () => {
    if (size) setRect(initialRect(size.w, size.h, aspect, startFraction));
  };

  const confirm = async () => {
    const img = loaderRef.current;
    if (!img || !rect) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await cropToBlob(img, clampRect(rect, size!.w, size!.h, aspect), aspect, outputWidth, outputHeight);
      await onDone(blob);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong while cropping.');
      setBusy(false);
    }
  };

  const level = size && rect ? zoomLevel(rect, size.w, size.h, aspect) : 1;
  const lowResolution = rect ? rect.w < outputWidth : false;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-6 w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{help}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onCancel} disabled={busy}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Loads the photo, and is the source for the final cut. */}
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={loaderRef}
            src={url}
            alt=""
            className="hidden"
            onLoad={handleLoad}
            onError={() => setError("Couldn't read that image. Try a JPG, PNG or WebP file.")}
          />
        )}

        <div ref={holderRef} className="mt-4 flex min-h-[200px] items-center justify-center">
          {!size && !error && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}

          {size && rect && variant === 'box' && (
            <div
              ref={stageRef}
              data-crop-stage="box"
              tabIndex={0}
              onKeyDown={onKeyDown}
              aria-label="Crop area. Drag the corners to resize it, drag inside it to move it. Press plus or minus to zoom."
              className="relative touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ width: stageW, height: stageH }}
            >
              <div
                className="absolute overflow-hidden rounded-md"
                style={{ left: PAD, top: PAD, width: size.w * scale, height: size.h * scale }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url!} alt="" draggable={false} className="h-full w-full select-none object-fill" />
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: rect.x * scale,
                    top: rect.y * scale,
                    width: rect.w * scale,
                    height: rectHeight(rect, aspect) * scale,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                  }}
                />
              </div>

              <div
                data-crop-box
                className="absolute cursor-move border-2 border-white"
                style={{
                  left: PAD + rect.x * scale,
                  top: PAD + rect.y * scale,
                  width: rect.w * scale,
                  height: rectHeight(rect, aspect) * scale,
                }}
                onPointerDown={(e) => startDrag(e, 'move')}
                onPointerMove={onMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
                  <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
                  <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
                </div>
                {CORNERS.map((corner) => (
                  <div
                    key={corner}
                    data-handle={corner}
                    aria-label={`Drag to resize from the ${CORNER_NAME[corner]} corner`}
                    className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center ${
                      corner === 'nw' || corner === 'se' ? 'cursor-nwse-resize' : 'cursor-nesw-resize'
                    }`}
                    style={{
                      left: corner === 'nw' || corner === 'sw' ? 0 : '100%',
                      top: corner === 'nw' || corner === 'ne' ? 0 : '100%',
                    }}
                    onPointerDown={(e) => startDrag(e, 'corner', corner)}
                    onPointerMove={onMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  >
                    <span className="block h-3.5 w-3.5 rounded-sm border-2 border-primary bg-white shadow" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {size && rect && variant === 'frame' && (
            <div
              ref={stageRef}
              data-crop-stage="frame"
              tabIndex={0}
              onKeyDown={onKeyDown}
              aria-label="Photo position. Drag the photo to choose the part to show. Press plus or minus to zoom."
              className="relative cursor-grab touch-none select-none overflow-hidden rounded-xl bg-black outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
              style={{ width: stageW, height: stageH }}
              onPointerDown={(e) => startDrag(e, 'pan')}
              onPointerMove={onMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url!}
                alt=""
                draggable={false}
                className="absolute max-w-none select-none"
                style={{
                  left: (stageW - frame.w) / 2 - rect.x * scale,
                  top: (stageH - frame.h) / 2 - rect.y * scale,
                  width: size.w * scale,
                  height: size.h * scale,
                }}
              />
              <div
                className="pointer-events-none absolute rounded-2xl border-2 border-white"
                style={{
                  left: (stageW - frame.w) / 2,
                  top: (stageH - frame.h) / 2,
                  width: frame.w,
                  height: frame.h,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                }}
              >
                <div className="absolute inset-y-0 left-1/3 w-px bg-white/30" />
                <div className="absolute inset-y-0 left-2/3 w-px bg-white/30" />
                <div className="absolute inset-x-0 top-1/3 h-px bg-white/30" />
                <div className="absolute inset-x-0 top-2/3 h-px bg-white/30" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {size && rect && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5" role="group" aria-label="Zoom">
                <Button type="button" variant="outline" size="icon" aria-label="Zoom out" onClick={() => zoom(1 / ZOOM_STEP)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span data-zoom className="w-14 text-center text-sm tabular-nums" aria-live="polite">
                  {Math.round(level * 100)}%
                </span>
                <Button type="button" variant="outline" size="icon" aria-label="Zoom in" onClick={() => zoom(ZOOM_STEP)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <input
                type="range"
                min={100}
                max={800}
                step={5}
                value={Math.min(800, Math.max(100, Math.round(level * 100)))}
                onChange={(e) => apply((r, w, h) => zoomTo(r, Number(e.target.value) / 100, w, h, aspect))}
                aria-label="Zoom level"
                className="min-w-[8rem] flex-1 accent-[hsl(var(--primary))]"
              />
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset
              </Button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground" data-crop-info>
              Final picture: {outputWidth} × {outputHeight} px. You are showing {Math.round(rect.w)} ×{' '}
              {Math.round(rectHeight(rect, aspect))} px of your photo.
            </p>
            {lowResolution && (
              <p className="mt-1 text-xs text-warning">
                This part is smaller than {outputWidth} px wide, so it will be enlarged and may look a little soft. Zoom out or use a bigger photo for a sharper result.
              </p>
            )}
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={confirm} disabled={busy || !rect}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {busy ? 'Saving...' : 'Use this crop'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
