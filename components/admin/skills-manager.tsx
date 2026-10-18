'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Skill } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase.from('skills').select('*').order('sort_order');
    setSkills(data ?? []);
    setLoading(false);
  };

  const save = async (skill: Partial<Skill> & { name: string; category: string }) => {
    setSaving(true);
    if (skill.id) {
      await supabase.from('skills').update(skill).eq('id', skill.id);
    } else {
      await supabase.from('skills').insert(skill);
    }
    setSaving(false);
    setEditing(null);
    setCreating(false);
    load(true);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this skill?')) return;
    const previous = skills;
    setSkills((prev) => prev.filter((item) => item.id !== id));
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (error) {
      setSkills(previous);
      alert(`Could not delete: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Skills ({skills.length})</h2>
        <Button size="sm" onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" />Add skill</Button>
      </div>

      <div className="space-y-2">
        {skills.length === 0 ? (
          <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">No skills yet.</p>
        ) : (
          skills.map((skill) => (
            <div key={skill.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{skill.category}</span>
                <span className="text-sm font-medium">{skill.name}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(skill)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => del(skill.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))
        )}
      </div>

      {(editing || creating) && (
        <SkillForm
          skill={editing ?? { name: '', category: 'Design', sort_order: 0 }}
          saving={saving}
          onSave={save}
          onCancel={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

function SkillForm({ skill, saving, onSave, onCancel }: {
  skill: Partial<Skill>;
  saving: boolean;
  onSave: (s: any) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(skill.name ?? '');
  const [category, setCategory] = useState(skill.category ?? 'Design');
  const [sortOrder, setSortOrder] = useState(skill.sort_order ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <form
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onSave({ ...skill, name, category, sort_order: sortOrder }); }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{skill.id ? 'Edit skill' : 'New skill'}</h2>
          <button type="button" onClick={onCancel}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" /></div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
                <SelectItem value="Data">Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Sort order</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="mt-1.5" /></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Save</Button>
        </div>
      </form>
    </div>
  );
}
