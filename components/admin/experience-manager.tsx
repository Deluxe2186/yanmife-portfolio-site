'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Experience } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function ExperienceManager() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('experience').select('*').order('sort_order');
    setItems(data ?? []);
    setLoading(false);
  };

  const save = async (exp: Partial<Experience> & { role: string; company: string; start_date: string }) => {
    setSaving(true);
    if (exp.id) {
      await supabase.from('experience').update(exp).eq('id', exp.id);
    } else {
      await supabase.from('experience').insert(exp);
    }
    setSaving(false);
    setEditing(null);
    setCreating(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this experience entry?')) return;
    await supabase.from('experience').delete().eq('id', id);
    load();
  };

  const reorder = async (exp: Experience, dir: 'up' | 'down') => {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((e) => e.id === exp.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    await Promise.all([
      supabase.from('experience').update({ sort_order: swap.sort_order }).eq('id', exp.id),
      supabase.from('experience').update({ sort_order: exp.sort_order }).eq('id', swap.id),
    ]);
    load();
  };

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Experience ({items.length})</h2>
        <Button size="sm" onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" />Add experience</Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">No experience entries yet.</p>
        ) : (
          items.map((exp) => (
            <div key={exp.id} className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
              <div className="flex-1">
                <h3 className="font-medium">{exp.role}</h3>
                <p className="text-sm text-primary">{exp.company}</p>
                <p className="text-xs text-muted-foreground">{exp.start_date} — {exp.end_date || 'Present'}</p>
                {exp.description && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{exp.description}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => reorder(exp, 'up')}><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => reorder(exp, 'down')}><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setEditing(exp)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => del(exp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))
        )}
      </div>

      {(editing || creating) && (
        <ExperienceForm
          exp={editing ?? { role: '', company: '', start_date: '', end_date: '', description: '', sort_order: 0 }}
          saving={saving}
          onSave={save}
          onCancel={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

function ExperienceForm({ exp, saving, onSave, onCancel }: {
  exp: Partial<Experience>;
  saving: boolean;
  onSave: (e: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    role: exp.role ?? '',
    company: exp.company ?? '',
    start_date: exp.start_date ?? '',
    end_date: exp.end_date ?? '',
    description: exp.description ?? '',
    sort_order: exp.sort_order ?? 0,
  });

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <form
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onSave({ ...exp, ...form }); }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{exp.id ? 'Edit experience' : 'New experience'}</h2>
          <button type="button" onClick={onCancel}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div><Label>Role</Label><Input value={form.role} onChange={(e) => update('role', e.target.value)} required className="mt-1.5" /></div>
          <div><Label>Company</Label><Input value={form.company} onChange={(e) => update('company', e.target.value)} required className="mt-1.5" /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Start (YYYY-MM)</Label><Input value={form.start_date} onChange={(e) => update('start_date', e.target.value)} placeholder="2024-01" required className="mt-1.5" /></div>
            <div><Label>End (YYYY-MM)</Label><Input value={form.end_date ?? ''} onChange={(e) => update('end_date', e.target.value)} placeholder="Present" className="mt-1.5" /></div>
            <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => update('sort_order', parseInt(e.target.value) || 0)} className="mt-1.5" /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description ?? ''} onChange={(e) => update('description', e.target.value)} rows={3} className="mt-1.5" /></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save</Button>
        </div>
      </form>
    </div>
  );
}
