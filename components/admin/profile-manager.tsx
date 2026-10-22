'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Trash2, Upload, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  PROFILE_BUCKET,
  PROFILE_FOLDER,
  fetchProfilePhoto,
} from '@/lib/profile-photo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CropDialog } from '@/components/admin/crop-dialog';
import { PROFILE_SIZE } from '@/lib/image-sizes';

const MAX_SIZE_MB = 25; // the photo you pick before cropping
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function ProfileManager() {
  const [url, setUrl] = useState<string | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const photo = await fetchProfilePhoto();
        setUrl(photo.url);
        setNames(photo.names);
      } catch (err: any) {
        setMessage({ type: 'error', text: `Could not load your photo: ${err.message}` });
      }
      setLoading(false);
    })();
  }, []);

  /** Checks the picked photo, then opens the cropper. */
  const handleFile = (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = ''; // lets you pick the same file again
    if (!file) return;
    setMessage(null);

    if (!EXTENSIONS[file.type]) {
      setMessage({ type: 'error', text: 'Please choose a JPG, PNG or WebP image.' });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage({ type: 'error', text: `That image is too big. Keep it under ${MAX_SIZE_MB} MB.` });
      return;
    }
    setCropFile(file);
  };

  /** Uploads the cropped square photo. */
  const uploadCropped = async (blob: Blob) => {
    setCropFile(null);
    setBusy(true);
    // A new file name each time, so visitors never see a cached old photo.
    const path = `${PROFILE_FOLDER}/photo-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(path, blob, { cacheControl: '31536000', contentType: 'image/jpeg' });

    if (error) {
      setBusy(false);
      setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
      return;
    }

    // Clean up the older photos. If this fails, the new photo still works.
    const old = names.map((name) => `${PROFILE_FOLDER}/${name}`);
    if (old.length > 0) await supabase.storage.from(PROFILE_BUCKET).remove(old);

    try {
      const photo = await fetchProfilePhoto();
      setUrl(photo.url);
      setNames(photo.names);
      setMessage({ type: 'ok', text: 'Photo updated. It is now live in the About section.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Uploaded, but could not refresh: ${err.message}` });
    }
    setBusy(false);
  };

  const handleRemove = async () => {
    if (!confirm('Remove your profile photo from the site?')) return;
    setBusy(true);
    setMessage(null);
    const paths = names.map((name) => `${PROFILE_FOLDER}/${name}`);
    const { error } = await supabase.storage.from(PROFILE_BUCKET).remove(paths);
    setBusy(false);
    if (error) {
      setMessage({ type: 'error', text: `Could not remove it: ${error.message}` });
      return;
    }
    setUrl(null);
    setNames([]);
    setMessage({ type: 'ok', text: 'Photo removed. The About section shows the placeholder again.' });
  };

  if (loading) {
    return <Skeleton className="aspect-square w-full max-w-xs rounded-2xl" />;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Profile photo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown in the About section. After you pick a photo, drag it to choose the part to show and zoom to resize it. It is saved as a {PROFILE_SIZE} × {PROFILE_SIZE} px square.
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-card">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Your current profile photo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-20 w-20 text-muted-foreground/40" />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload className="mr-1.5 h-4 w-4" />
              {url ? 'Replace photo' : 'Upload photo'}
            </Button>
            {url && (
              <Button variant="outline" onClick={handleRemove} disabled={busy}>
                <Trash2 className="mr-1.5 h-4 w-4 text-destructive" />
                Remove
              </Button>
            )}
          </div>
          {message && (
            <p className={message.type === 'ok' ? 'text-sm text-success' : 'text-sm text-destructive'} role="status">
              {message.text}
            </p>
          )}
        </div>
      </div>

      {cropFile && (
        <CropDialog
          file={cropFile}
          variant="frame"
          aspect={1}
          outputWidth={PROFILE_SIZE}
          outputHeight={PROFILE_SIZE}
          title="Position your photo"
          help="Drag the photo to choose the part inside the frame. Use the + and - buttons, the slider or the mouse wheel to resize it."
          onCancel={() => setCropFile(null)}
          onDone={uploadCropped}
        />
      )}
    </div>
  );
}
