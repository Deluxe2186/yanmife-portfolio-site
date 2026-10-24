'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Copy, Crop, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import type { ProjectImage } from '@/lib/types';
import { COVER_ASPECT, COVER_HEIGHT, COVER_WIDTH } from '@/lib/image-sizes';
import { prepareGalleryImage } from '@/lib/image-prep';
import { uploadProjectImage } from '@/lib/project-uploads';
import { PROJECT_IMAGES_SETUP_SQL } from '@/lib/project-images-sql';
import { copyText } from '@/lib/clipboard';
import { CropDialog } from '@/components/admin/crop-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_SOURCE_MB = 25;

type Note = { type: 'ok' | 'error'; text: string } | null;

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

interface Props {
  images: ProjectImage[];
  onImagesChange: (update: (previous: ProjectImage[]) => ProjectImage[]) => void;
  coverUrl: string | null;
  thumbnailId: string | null;
  /** Called when a new thumbnail was made. imageId is null when it is not tied to a gallery image. */
  onThumbnailChange: (imageId: string | null, coverUrl: string | null) => void;
  /** Used to name the uploaded files. */
  baseName: string;
  /** True while the database does not have the images column yet. */
  columnMissing: boolean;
}

export function ProjectImagesEditor({
  images,
  onImagesChange,
  coverUrl,
  thumbnailId,
  onThumbnailChange,
  baseName,
  columnMissing,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [cropSource, setCropSource] = useState<{ file: File; imageId: string | null } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);
  const legacyRef = useRef<HTMLInputElement>(null);
  const titleRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Put the cursor in the title of a picture that was just added.
  useEffect(() => {
    if (!focusId) return;
    titleRefs.current[focusId]?.focus();
    setFocusId(null);
  }, [focusId, images]);

  const busy = uploading || opening !== null;

  /** Opens the cropper on one of the project's pictures. */
  const startThumbnail = async (image: ProjectImage) => {
    setNote(null);
    setOpening(image.id);
    try {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      setCropSource({ file: new File([blob], 'source', { type: blob.type || 'image/jpeg' }), imageId: image.id });
    } catch {
      setNote({ type: 'error', text: "Couldn't open that picture for cropping. Check your connection and try again." });
    }
    setOpening(null);
  };

  const addFiles = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (addRef.current) addRef.current.value = ''; // lets you pick the same file again
    if (files.length === 0) return;

    setNote(null);
    setUploading(true);
    const added: ProjectImage[] = [];
    const problems: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        problems.push(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > MAX_SOURCE_MB * 1024 * 1024) {
        problems.push(`${file.name} is too big. Keep each image under ${MAX_SOURCE_MB} MB.`);
        continue;
      }
      try {
        const prepared = await prepareGalleryImage(file);
        const result = await uploadProjectImage('gallery', baseName, prepared, prepared.name);
        if (result.error || !result.url) {
          problems.push(result.error ?? 'Upload failed.');
          continue;
        }
        added.push({ id: newId(), url: result.url, title: '' });
      } catch (err: any) {
        problems.push(`${file.name}: ${err?.message ?? 'could not be added.'}`);
      }
    }

    if (added.length > 0) {
      onImagesChange((previous) => [...previous, ...added]);
      setFocusId(added[0].id);
    }
    setUploading(false);

    if (problems.length > 0) {
      setNote({ type: 'error', text: problems.join(' ') });
    } else if (added.length > 0) {
      setNote({
        type: 'ok',
        text: `Added ${added.length} image${added.length === 1 ? '' : 's'}. Give each one a title, then press Save.`,
      });
    }

    // The first picture of a project becomes its thumbnail.
    if (added.length > 0 && !coverUrl) startThumbnail(added[0]);
  };

  const finishThumbnail = async (blob: Blob) => {
    const source = cropSource;
    setCropSource(null);
    if (!source) return;
    setUploading(true);
    const result = await uploadProjectImage('covers', baseName, blob, 'cover.jpg');
    setUploading(false);
    if (result.error || !result.url) {
      setNote({ type: 'error', text: result.error ?? 'Upload failed.' });
      return;
    }
    onThumbnailChange(source.imageId, result.url);
    setNote({ type: 'ok', text: 'Thumbnail updated. Press Save to keep it.' });
  };

  const setTitle = (id: string, title: string) =>
    onImagesChange((previous) => previous.map((i) => (i.id === id ? { ...i, title } : i)));

  const move = (index: number, direction: -1 | 1) =>
    onImagesChange((previous) => {
      const target = index + direction;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const remove = (image: ProjectImage) => {
    onImagesChange((previous) => previous.filter((i) => i.id !== image.id));
    if (image.id === thumbnailId) {
      onThumbnailChange(null, coverUrl); // the thumbnail stays until you make a new one
      setNote({ type: 'ok', text: 'Image removed. The current thumbnail stays until you pick a new one.' });
    }
  };

  const copySql = async () => {
    setCopied(await copyText(PROJECT_IMAGES_SETUP_SQL));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <Label>Project images</Label>
      <p className="mt-1 text-xs text-muted-foreground">
        Add as many pictures as you like. They show on the project page from top to bottom. Choose one as the
        thumbnail ({COVER_WIDTH} × {COVER_HEIGHT} px) for the project card.
      </p>

      <div className="mt-3 flex items-center gap-4 rounded-xl border border-border bg-background p-3">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="Current thumbnail" className="aspect-[4/3] w-32 shrink-0 rounded-md border border-border object-cover" />
        ) : (
          <div className="flex aspect-[4/3] w-32 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            No thumbnail
          </div>
        )}
        <div className="text-sm">
          <p className="font-medium">Thumbnail</p>
          <p className="text-xs text-muted-foreground">
            {coverUrl
              ? 'This is the picture on the project card. Use "Adjust thumbnail" on an image below to change it.'
              : columnMissing
                ? 'Upload a thumbnail below.'
                : 'Add an image below, then press "Use as thumbnail" on it.'}
          </p>
        </div>
      </div>

      {columnMissing && (
        <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <p className="font-medium">One-time setup to add several images</p>
          <p className="text-muted-foreground">
            Your database needs one more column. In Supabase, open <strong>SQL Editor → New query</strong>, paste this,
            click <strong>Run</strong>, then reload this page.
          </p>
          <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-card p-3 text-xs">{PROJECT_IMAGES_SETUP_SQL}</pre>
          <Button type="button" variant="outline" size="sm" onClick={copySql}>
            {copied ? <Check className="mr-1.5 h-4 w-4 text-success" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy the SQL'}
          </Button>
          <div>
            <input
              ref={legacyRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file && file.type.startsWith('image/')) setCropSource({ file, imageId: null });
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => legacyRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" />
              Upload a thumbnail for now
            </Button>
          </div>
        </div>
      )}

      {!columnMissing && (
        <>
          <ul className="mt-4 space-y-3" aria-label="Project images">
            {images.map((image, index) => {
              const isThumbnail = image.id === thumbnailId;
              return (
                <li key={image.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt="" className="h-20 w-28 rounded-md border border-border object-cover" />
                    {isThumbnail && (
                      <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Thumbnail
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      ref={(node) => {
                        titleRefs.current[image.id] = node;
                      }}
                      value={image.title}
                      onChange={(e) => setTitle(image.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault(); // do not save the whole project
                      }}
                      placeholder="Image title, for example Home page"
                      aria-label={`Title for image ${index + 1}`}
                      maxLength={80}
                    />
                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isThumbnail ? 'secondary' : 'outline'}
                        disabled={busy}
                        onClick={() => startThumbnail(image)}
                      >
                        {opening === image.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Crop className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {isThumbnail ? 'Adjust thumbnail' : 'Use as thumbnail'}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move image ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move image ${index + 1} down`} disabled={index === images.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remove image ${index + 1}`} onClick={() => remove(image)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-3">
            <input
              ref={addRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => addRef.current?.click()}>
              {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-1.5 h-4 w-4" />}
              {uploading ? 'Uploading...' : images.length === 0 ? 'Add images' : 'Add more images'}
            </Button>
            <span className="ml-3 text-xs text-muted-foreground">
              Large pictures are shrunk to 2400 px wide so the page stays fast.
            </span>
          </div>
        </>
      )}

      {note && (
        <p role="status" className={`mt-2 text-sm ${note.type === 'ok' ? 'text-success' : 'text-destructive'}`}>
          {note.text}
        </p>
      )}

      {cropSource && (
        <CropDialog
          file={cropSource.file}
          variant="box"
          aspect={COVER_ASPECT}
          outputWidth={COVER_WIDTH}
          outputHeight={COVER_HEIGHT}
          title="Crop the thumbnail"
          help="Drag the corners of the box to choose the part to show. Drag inside the box to move it. Use the + and - buttons to zoom."
          onCancel={() => setCropSource(null)}
          onDone={finishThumbnail}
        />
      )}
    </div>
  );
}
