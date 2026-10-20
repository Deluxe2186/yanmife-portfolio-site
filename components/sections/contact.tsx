'use client';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Download, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { siteConfig } from '@/lib/site-config';
import { useCv } from '@/hooks/use-data';
import { formatSize } from '@/lib/storage-files';
import { CopyEmail } from '@/components/copy-email';
import { SectionReveal } from '@/components/section-reveal';
import { SectionHeading } from '@/components/section-heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ContactSection() {
  const cv = useCv();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reduceMotion = useReducedMotion();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Please enter your name';
    if (!email.trim()) e.email = 'Please enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Please enter a valid email';
    if (!message.trim()) e.message = 'Please enter a message';
    else if (message.trim().length < 10)
      e.message = 'Message must be at least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus('loading');

    const { error } = await supabase.from('messages').insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    if (error) {
      setStatus('error');
      return;
    }

    setStatus('success');
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setStatus('idle'), 5000);
  };

  return (
    <SectionReveal id="contact" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="Contact"
        title="Let's work together"
        subtitle="Got a project in mind? Send me a message and I'll reply as soon as I can."
      />

      <div className="grid gap-8 sm:grid-cols-3">
        <div className="sm:col-span-1 space-y-4">
          <CopyEmail email={siteConfig.email} />
          {cv && (
            <a
              href={cv.downloadUrl}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm transition-colors hover:border-primary"
            >
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Download CV</p>
                <p className="text-xs text-muted-foreground">
                  PDF{cv.size ? `, ${formatSize(cv.size)}` : ''}
                </p>
              </div>
            </a>
          )}
        </div>

        <form onSubmit={handleSubmit} className="sm:col-span-2 space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-invalid={!!errors.name}
              className="mt-1.5"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              className="mt-1.5"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell me about your project..."
              rows={5}
              aria-invalid={!!errors.message}
              className="mt-1.5 resize-none"
            />
            {errors.message && (
              <p className="mt-1 text-xs text-destructive">{errors.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="w-full"
          >
            <AnimatePresence mode="wait">
              {status === 'loading' ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </motion.span>
              ) : status === 'success' ? (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Message sent!
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send message
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success"
            >
              <CheckCircle className="h-4 w-4" />
              Thanks, I got your message. I&apos;ll reply soon.
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              Something went wrong. Please try again or email me directly.
            </motion.div>
          )}
        </form>
      </div>
    </SectionReveal>
  );
}
