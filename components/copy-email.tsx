'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Mail } from 'lucide-react';
import { copyText } from '@/lib/clipboard';

/** An email card. Clicking it copies the address and shows a short confirmation. */
export function CopyEmail({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleCopy = async () => {
    const ok = await copyText(email);
    setStatus(ok ? 'copied' : 'failed');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 2200);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy email address ${email}`}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left text-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Mail className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Email</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        {status === 'copied' ? (
          <Check className="h-4 w-4 shrink-0 text-success" />
        ) : (
          <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute -top-3 right-3 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg"
          >
            {status === 'copied' ? (
              <>
                <Check className="h-3 w-3" /> Copied to clipboard
              </>
            ) : (
              "Couldn't copy"
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p role="status" aria-live="polite" className="sr-only">
        {status === 'copied' ? 'Email address copied to clipboard' : ''}
      </p>
    </div>
  );
}
