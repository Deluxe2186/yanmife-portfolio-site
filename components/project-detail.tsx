'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, Figma, Link2, X } from 'lucide-react';
import { copyText } from '@/lib/clipboard';
import type { Project, ProjectImage } from '@/lib/types';
import { Button } from '@/components/ui/button';

/** The address that opens this project directly. */
export function projectLink(slug: string) {
  return `${window.location.origin}${window.location.pathname}#project-${encodeURIComponent(slug)}`;
}

function publishedOn(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Every picture to show: the project's gallery, or just the thumbnail for older projects. */
function galleryOf(project: Project): ProjectImage[] {
  if (project.images && project.images.length > 0) return project.images;
  if (project.cover_image_url) {
    return [{ id: 'cover', url: project.cover_image_url, title: '' }];
  }
  return [];
}

/**
 * Project page as a floating card over a dimmed page. Details on the left
 * stay in view while you scroll through the pictures on the right.
 */
export function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock the page behind, close on Escape, and hand focus back when it closes.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      previous?.focus?.();
    };
  }, []);

  const copyLink = async () => {
    const ok = await copyText(projectLink(project.slug));
    setCopied(ok);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const images = galleryOf(project);
  const published = publishedOn(project.created_at);
  const about = project.description || project.overview;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-title"
        className="relative w-full max-w-6xl rounded-2xl border border-border bg-card shadow-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25 }}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close project"
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-4 sm:top-4"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-h-[calc(100vh-1.5rem)] overflow-y-auto overscroll-contain px-5 pb-10 sm:max-h-[calc(100vh-3rem)] sm:px-8">
          <header className="flex items-start justify-between gap-6 pb-8 pr-14 pt-8 sm:pr-16 sm:pt-10">
            <h2
              id="project-detail-title"
              className="text-balance text-2xl font-medium tracking-tight sm:text-3xl lg:text-4xl"
            >
              {project.title}
            </h2>
            <button
              type="button"
              onClick={copyLink}
              className="mt-2 inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copied ? 'Link copied' : 'Copy link'}
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            </button>
          </header>
          <p role="status" aria-live="polite" className="sr-only">
            {copied ? 'Project link copied to clipboard' : ''}
          </p>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-10">
          <aside className="space-y-8 lg:sticky lg:top-0 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
            {project.role && (
              <p className="text-base">
                <span className="text-muted-foreground">My role. </span>
                {project.role}
              </p>
            )}

            {about && (
              <section>
                <h3 className="text-base text-muted-foreground">Project description.</h3>
                <p className="mt-4 whitespace-pre-line text-base leading-relaxed">{about}</p>
              </section>
            )}

            {project.tools.length > 0 && (
              <section>
                <h3 className="text-base text-muted-foreground">Skills and deliverables</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {project.tools.map((tool) => (
                    <li key={tool} className="rounded-md bg-secondary px-4 py-2 text-base text-secondary-foreground">
                      {tool}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {published && (
              <p className="text-sm text-muted-foreground">Published on {published}</p>
            )}

            {(project.live_url || project.figma_url) && (
              <div className="flex flex-wrap gap-3 border-t border-border pt-6">
                {project.live_url && (
                  <Button asChild>
                    <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View live
                    </a>
                  </Button>
                )}
                {project.figma_url && (
                  <Button variant="outline" asChild>
                    <a href={project.figma_url} target="_blank" rel="noopener noreferrer">
                      <Figma className="mr-2 h-4 w-4" />
                      View in Figma
                    </a>
                  </Button>
                )}
              </div>
            )}
          </aside>

          <div className="space-y-6" data-gallery>
            {images.map((image, index) => (
              <figure key={image.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.title || `${project.title}, image ${index + 1}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="block h-auto w-full rounded-md bg-muted"
                />
                {image.title && (
                  <figcaption className="mt-2 text-sm text-muted-foreground">{image.title}</figcaption>
                )}
              </figure>
            ))}
            {images.length === 0 && (
              <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
                No images yet for this project.
              </p>
            )}
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
