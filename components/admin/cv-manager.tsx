'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { BUCKET, formatSize } from '@/lib/storage-files';
import { CV_FOLDER, fetchCv, type Cv } from '@/lib/cv';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_SIZE_MB = 10;

export function CvManager() {
  const [cv, setCv] = useState<Cv | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        setCv(await fetchCv());
      } catch (err: any) {
        setMessage({ type: 'error', text: `Could not load your CV: ${err.message}` });
      }
      setLoading(false);
    })();
  }, []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);

    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Please choose a PDF file.' });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage({ type: 'error', text: `That file is too big. Keep it under ${MAX_SIZE_MB} MB.` });
      return;
    }

    setBusy(true);
    // A new file name each time, so nobody gets a cached old copy.
    const path = `${CV_FOLDER}/cv-${Date.now()}.pdf`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', contentType: 'application/pdf' });

    if (error) {
      setBusy(false);
      setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
      return;
    }

    // Clean up older copies. If this fails, the new CV still works.
    const old = (cv?.names ?? []).map((name) => `${CV_FOLDER}/${name}`);
    if (old.length > 0) await supabase.storage.from(BUCKET).remove(old);

    try {
      setCv(await fetchCv());
      setMessage({ type: 'ok', text: 'CV updated. The Download CV button on your site now uses it.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Uploaded, but could not refresh: ${err.message}` });
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRemove = async () => {
    if (!cv || !confirm('Remove your CV? The Download CV button will disappear from your site.')) return;
    setBusy(true);
    setMessage(null);
    const paths = cv.names.map((name) => `${CV_FOLDER}/${name}`);
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    setBusy(false);
    if (error) {
      setMessage({ type: 'error', text: `Could not remove it: ${error.message}` });
      return;
    }
    setCv(null);
    setMessage({ type: 'ok', text: 'CV removed. The Download CV button is hidden until you upload a new one.' });
  };

  if (loading) {
    return <Skeleton className="h-24 w-full max-w-md rounded-2xl" />;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">CV</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visitors download it from the Contact section. PDF only, up to {MAX_SIZE_MB} MB. With no CV uploaded, the button stays hidden.
        </p>
      </div>

      <div className="flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <FileText className="h-8 w-8 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          {cv ? (
            <>
              <p className="truncate text-sm font-medium">Your CV is live</p>
              <p className="text-xs text-muted-foreground">PDF{cv.size ? `, ${formatSize(cv.size)}` : ''}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No CV uploaded yet.</p>
          )}
        </div>
        {cv && (
          <a
            href={cv.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      <div className="mt-3 space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload className="mr-1.5 h-4 w-4" />
            {cv ? 'Replace CV' : 'Upload CV'}
          </Button>
          {cv && (
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
  );
}
