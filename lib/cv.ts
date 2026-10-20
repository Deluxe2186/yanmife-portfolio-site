import { siteConfig } from '@/lib/site-config';
import { listFolder, publicUrl } from '@/lib/storage-files';

export const CV_FOLDER = 'cv';

export interface Cv {
  /** Link that saves the file with a clean name, e.g. Yanmife-Arayela-CV.pdf. */
  downloadUrl: string;
  /** Link that opens the PDF in the browser. */
  viewUrl: string;
  size: number | null;
  /** File names currently stored in the cv folder (newest first). */
  names: string[];
}

export const cvDownloadName = () => `${siteConfig.name.replace(/\s+/g, '-')}-CV.pdf`;

/** Finds the newest CV in storage, or null if none has been uploaded. */
export async function fetchCv(): Promise<Cv | null> {
  const files = await listFolder(CV_FOLDER);
  if (files.length === 0) return null;
  const path = `${CV_FOLDER}/${files[0].name}`;
  return {
    downloadUrl: publicUrl(path, cvDownloadName()),
    viewUrl: publicUrl(path),
    size: files[0].size,
    names: files.map((file) => file.name),
  };
}
