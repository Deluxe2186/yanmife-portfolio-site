'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Project } from '@/lib/types';
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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true });
    setProjects(data ?? []);
    setLoading(false);
  };

  const handleSave = async (project: Omit<Project, 'id' | 'created_at'> & { id?: string }) => {
    setSaving(true);
    if (project.id) {
      await supabase.from('projects').update(project).eq('id', project.id);
    } else {
      await supabase.from('projects').insert(project);
    }
    setSaving(false);
    setEditing(null);
    setCreating(false);
    loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await supabase.from('projects').delete().eq('id', id);
    loadProjects();
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
    loadProjects();
  };

  const handleUpload = async (file: File, project: any) => {
    const ext = file.name.split('.').pop();
    const fileName = `${project.slug || Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('project-images')
      .upload(fileName, file, { upsert: true });
    if (error) {
      alert(`Upload failed: ${error.message}`);
      return;
    }
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
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
}: {
  project: Omit<Project, 'id' | 'created_at'> & { id?: string };
  saving: boolean;
  onSave: (p: any) => void;
  onCancel: () => void;
  onUpload: (file: File, p: any) => Promise<string | undefined>;
  fileRef: React.RefObject<HTMLInputElement>;
}) {
  const [form, setForm] = useState({ ...project });
  const [toolsText, setToolsText] = useState((project.tools ?? []).join(', '));

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    onSave({
      ...form,
      slug,
      tools: toolsText.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await onUpload(file, form);
    if (url) update('cover_image_url', url);
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
              <Select value={form.category} onValueChange={(v) => update('category', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web">Web</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Branding">Branding</SelectItem>
                </SelectContent>
              </Select>
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
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" />
                Upload
              </Button>
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt="cover" className="h-12 w-20 rounded-lg object-cover" />
              )}
            </div>
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

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
