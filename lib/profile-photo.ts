import { supabase } from '@/lib/supabase/client';

export const PROFILE_BUCKET = 'project-images';
export const PROFILE_FOLDER = 'profile';

export interface ProfilePhoto {
  /** Public URL of the newest photo, or null when none has been uploaded. */
  url: string | null;
  /** File names currently stored in the profile folder (newest first). */
  names: string[];
}

/** Finds the newest profile photo in storage. Anyone can read it. */
export async function fetchProfilePhoto(): Promise<ProfilePhoto> {
  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .list(PROFILE_FOLDER, {
      limit: 50,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) throw error;

  const names = (data ?? [])
    .map((file) => file.name)
    .filter((name) => name && !name.startsWith('.'));

  if (names.length === 0) return { url: null, names: [] };

  const { data: urlData } = supabase.storage
    .from(PROFILE_BUCKET)
    .getPublicUrl(`${PROFILE_FOLDER}/${names[0]}`);

  return { url: urlData.publicUrl, names };
}
