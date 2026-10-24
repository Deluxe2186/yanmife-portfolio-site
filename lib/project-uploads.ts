import { supabase } from '@/lib/supabase/client';

export const IMAGE_BUCKET = 'project-images';

/** Turns a storage error into something that says what to do next. */
export function explainUploadError(message: string): string {
  if (/bucket not found/i.test(message)) {
    return 'The project-images storage bucket is missing in Supabase. Run the SQL setup file from the README, then try again.';
  }
  if (/row-level security|unauthorized|jwt|not authenticated/i.test(message)) {
    return 'Supabase refused the upload. Sign out, sign in again and retry.';
  }
  return `Upload failed: ${message}`;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'project';

/**
 * Uploads a picture to a folder of the project-images bucket and returns its public link.
 * Every upload gets a new file name, so a replaced picture never shows an old cached copy.
 */
export async function uploadProjectImage(
  folder: 'covers' | 'gallery',
  baseName: string,
  file: Blob,
  fileName = ''
): Promise<{ url?: string; error?: string }> {
  const ext =
    (fileName.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') ||
    (file.type.split('/')[1] ?? 'jpg').replace(/[^a-z0-9]/g, '') ||
    'jpg';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const path = `${folder}/${slugify(baseName)}-${unique}.${ext}`;

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', cacheControl: '31536000' });
  if (error) return { error: explainUploadError(error.message) };

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
