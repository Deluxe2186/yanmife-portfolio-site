'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Project } from '@/lib/types';
import { useCategories } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const MAX_COVER_MB = 8;

/** Turns a storage error into something that says what to do next. */
function explainUploadError(message: string): string {
  if (/bucket not found/i.test(message)) {
    return 'The project-images storage bucket is missing in Supabase. Run the SQL setup file from the README, then try again.';
  }
  if (/row-level security|unauthorized|jwt|not authenticated/i.test(message)) {
    return 'Supabase refused the upload. Sign out, sign in again and retry.';
  }
  return `Upload failed: ${message}`;
}

const emptyProject: Omit<Project, 'id' | 'created_at'> = {
  title: '',
  slug: '',
  category: 'Web',
  overview: '',
  description: '',
  cover_image_url: '',
  tools: [],
  role: '',
  live_url: '',
  figma_url: '',
  featured: false,
  sort_order: 0,
};

export function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { categories: categoryRows, tableMissing, reload: reloadCategories } = useCategories();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true });
    setProjects(data ?? []);
    setLoading(false);
  };

  /** Returns an error message to show in the form, or null when the save worked. */
  const handleSave = async (
    project: Omit<Project, 'id' | 'created_at'> & { id?: string }
  ): Promise<string | null> => {
    setSaving(true);
    const { id, created_at, ...fields } = project as any;
    const { error } = id
      ? await supabase.from('projects').update(fields).eq('id', id)
      : await supabase.from('projects').insert(fields);
    setSaving(false);
    if (error) {
      return /duplicate|unique/i.test(error.message)
        ? 'Another project already uses that slug. Change the slug or the title.'
        : `Could not save: ${error.message}`;
    }
    setEditing(null);
    setCreating(false);
    loadProjects(true);
    return null;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    const previous = projects;
    setProjects((prev) => prev.filter((item) => item.id !== id));
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      setProjects(previous);
      alert(`Could not delete: ${error.message}`);
    }
  };

  const handleReorder = async (project: Project, direction: 'up' | 'down') => {
    const sorted = [...projects].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((p) => p.id === project.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swap = sorted[swapIdx];
    await Promise.all([
      supabase.from('projects').update({ sort_order: swap.sort_order }).eq('id', project.id),
      supabase.from('projects').update({ sort_order: project.sort_order }).eq('id', swap.id),
    ]);
    loadProjects(true);
  };

  // Every category you can pick: your list, plus any a project already uses.
  const categoryOptions = Array.from(
    new Set([
      ...categoryRows.map((c) => c.name),
      ...projects.map((p) => p.category).filter(Boolean),
      ...(tableMissing && projects.length === 0 ? ['Web', 'Mobile', 'Branding'] : []),
    ])
  );

  /** Adds a category to your list. Returns an error message, or null when it worked. */
  const handleCreateCategory = async (name: string): Promise<string | null> => {
    // Before the categories table exists, a new name is just stored on the project.
    if (tableMissing) return null;
    if (categoryRows.some((c) => c.name.toLowerCase() === name.toLowerCase())) return null;
    const next = Math.max(0, ...categoryRows.map((c) => c.sort_order)) + 1;
    const { error } = await supabase.from('categories').insert({ name, sort_order: next });
    if (error) return `Could not add the category: ${error.message}`;
    await reloadCategories();
    return null;
  };

  const handleUpload = async (
    file: File,
    project: any
  ): Promise<{ url?: string; error?: string }> => {
    if (!file.type.startsWith('image/')) {
      return { error: 'Please choose an image file (JPG, PNG, WebP or GIF).' };
    }
    if (file.size > MAX_COVER_MB * 1024 * 1024) {
      return { error: `That image is too big. Keep it under ${MAX_COVER_MB} MB.` };
    }

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const base =
      String(project.slug || project.title || 'project')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'project';
    // A new file name every time, so a replaced cover never shows an old cached copy.
    const path = `covers/${base}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('project-images')
      .upload(path, file, { contentType: file.type, cacheControl: '31536000' });

    if (error) return { error: explainUploadError(error.message) };

    const { data } = supabase.storage.from('project-images').getPublicUrl(path);
    return { url: data.publicUrl };
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Projects ({projects.length})</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add project
        </Button>
      </div>

      <div className="space-y-3">
        {projects.length === 0 ? (
          <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No projects yet. Click &quot;Add project&quot; to create one.
          </p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              {project.cover_image_url ? (
                <img
                  src={project.cover_image_url}
                  alt={project.title}
                  className="h-16 w-24 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{project.title}</h3>
                  {project.featured && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{project.category} · {project.overview}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleReorder(project, 'up')}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleReorder(project, 'down')}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditing(project)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {(editing || creating) && (
        <ProjectForm
          project={editing ?? emptyProject}
          saving={saving}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onUpload={handleUpload}
          fileRef={fileRef}
          categoryOptions={categoryOptions}
          onCreateCategory={handleCreateCategory}
        />
      )}
    </div>
  );
}

function ProjectForm({
  project,
  saving,
  onSave,
  onCancel,
  onUpload,
  fileRef,
  categoryOptions,
  onCreateCategory,
}: {
  project: Omit<Project, 'id' | 'created_at'> & { id?: string };
  saving: boolean;
  onSave: (p: any) => Promise<string | null>;
  onCancel: () => void;
  onUpload: (file: File, p: any) => Promise<{ url?: string; error?: string }>;
  fileRef: React.RefObject<HTMLInputElement>;
  categoryOptions: string[];
  onCreateCategory: (name: string) => Promise<string | null>;
}) {
  const [form, setForm] = useState({ ...project });
  const [toolsText, setToolsText] = useState((project.tools ?? []).join(', '));

  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const options = categoryOptions.includes(form.category) || !form.category
    ? categoryOptions
    : [...categoryOptions, form.category];

  const createCategory = async () => {
    const name = newCategory.trim().replace(/\s+/g, ' ');
    if (!name) return setCategoryError('Type a name first.');
    if (name.length > 30) return setCategoryError('Keep it under 30 characters.');
    if (name.toLowerCase() === 'all') return setCategoryError('"All" is added automatically.');
    // Reuse the existing spelling if it is already in the list.
    const existing = options.find((o) => o.toLowerCase() === name.toLowerCase());
    const error = existing ? null : await onCreateCategory(name);
    if (error) return setCategoryError(error);
    update('category', existing ?? name);
    setNewCategory('');
    setCategoryError(null);
    setAddingCategory(false);
  };

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    setSaveError(null);
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const error = await onSave({
      ...form,
      slug,
      tools: toolsText.split(',').map((t) => t.trim()).filter(Boolean),
    });
    if (error) setSaveError(error);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadNote(null);
    const result = await onUpload(file, form);
    setUploading(false);
    input.value = ''; // lets you pick the same file again
    if (result.error) {
      setUploadNote({ type: 'error', text: result.error });
    } else if (result.url) {
      update('cover_image_url', result.url);
      setUploadNote({ type: 'ok', text: 'Uploaded. Press Save to keep the new cover.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <form
        onSubmit={submit}
        className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{project.id ? 'Edit project' : 'New project'}</h2>
          <button type="button" onClick={onCancel}><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => update('title', e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="auto-generated" className="mt-1.5" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => {
                  // The dropdown can briefly report an empty value right after a new
                  // category is added. Ignore it so the category is not wiped.
                  if (!v) return;
                  if (v === '__new__') {
                    setAddingCategory(true);
                    return;
                  }
                  setAddingCategory(false);
                  update('category', v);
                }}
              >
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a category" /></SelectTrigger>
                <SelectContent>
                  {options.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                  <SelectItem value="__new__">+ New category...</SelectItem>
                </SelectContent>
              </Select>
              {addingCategory && (
                <div className="mt-2">
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); // do not save the whole project
                          createCategory();
                        }
                      }}
                      placeholder="Name of the new category"
                      aria-label="New category name"
                      maxLength={30}
                    />
                    <Button type="button" size="sm" onClick={createCategory}>Add</Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => { setAddingCategory(false); setCategoryError(null); }}
                    >
                      Cancel
                    </Button>
                  </div>
                  {categoryError && <p className="mt-1 text-xs text-destructive">{categoryError}</p>}
                </div>
              )}
            </div>
            <div>
              <Label>Role</Label>
              <Input value={form.role ?? ''} onChange={(e) => update('role', e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Overview (one line)</Label>
            <Input value={form.overview} onChange={(e) => update('overview', e.target.value)} required className="mt-1.5" />
          </div>

          <div>
            <Label>Description (full case study)</Label>
            <Textarea value={form.description ?? ''} onChange={(e) => update('description', e.target.value)} rows={4} className="mt-1.5" />
          </div>

          <div>
            <Label>Tools (comma-separated)</Label>
            <Input value={toolsText} onChange={(e) => setToolsText(e.target.value)} placeholder="Figma, React, Tailwind" className="mt-1.5" />
          </div>

          <div>
            <Label>Cover image</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-4 w-4" />
                )}
                {uploading ? 'Uploading...' : form.cover_image_url ? 'Replace image' : 'Upload image'}
              </Button>
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt="Cover preview" className="h-16 w-28 rounded-lg border border-border object-cover" />
              )}
            </div>
            {uploadNote && (
              <p
                role="status"
                className={uploadNote.type === 'ok' ? 'mt-2 text-sm text-success' : 'mt-2 text-sm text-destructive'}
              >
                {uploadNote.text}
              </p>
            )}
            <Input
              value={form.cover_image_url ?? ''}
              onChange={(e) => update('cover_image_url', e.target.value)}
              placeholder="or paste image URL"
              className="mt-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Live URL</Label>
              <Input value={form.live_url ?? ''} onChange={(e) => update('live_url', e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Figma URL</Label>
              <Input value={form.figma_url ?? ''} onChange={(e) => update('figma_url', e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => update('sort_order', parseInt(e.target.value) || 0)} className="mt-1.5" />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Checkbox id="featured" checked={form.featured} onCheckedChange={(v) => update('featured', v === true)} />
              <Label htmlFor="featured">Featured project</Label>
            </div>
          </div>
        </div>

        {saveError && (
          <p role="alert" className="mt-4 text-sm text-destructive">{saveError}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving || uploading}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
