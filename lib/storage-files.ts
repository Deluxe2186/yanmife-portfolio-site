import { supabase } from '@/lib/supabase/client';

export const BUCKET = 'project-images';

export interface StoredFile {
  name: string;
  size: number | null;
}

/** Lists the files in a storage folder, newest first. Anyone can read them. */
export async function listFolder(folder: string): Promise<StoredFile[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 50,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) throw error;

  return (data ?? [])
    .filter((file) => file.name && !file.name.startsWith('.'))
    .map((file) => ({
      name: file.name,
      size: typeof file.metadata?.size === 'number' ? file.metadata.size : null,
    }));
}

/** Public link to a file. Pass downloadName to make the browser save it with that name. */
export function publicUrl(path: string, downloadName?: string): string {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path, downloadName ? { download: downloadName } : undefined);
  return data.publicUrl;
}

export function formatSize(bytes: number | null): string {
  if (bytes === null) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
