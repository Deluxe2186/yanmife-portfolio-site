import { BUCKET, listFolder, publicUrl } from '@/lib/storage-files';

export const PROFILE_BUCKET = BUCKET;
export const PROFILE_FOLDER = 'profile';

export interface ProfilePhoto {
  /** Public URL of the newest photo, or null when none has been uploaded. */
  url: string | null;
  /** File names currently stored in the profile folder (newest first). */
  names: string[];
}

/** Finds the newest profile photo in storage. Anyone can read it. */
export async function fetchProfilePhoto(): Promise<ProfilePhoto> {
  const files = await listFolder(PROFILE_FOLDER);
  const names = files.map((file) => file.name);
  if (names.length === 0) return { url: null, names: [] };
  return { url: publicUrl(`${PROFILE_FOLDER}/${names[0]}`), names };
}
