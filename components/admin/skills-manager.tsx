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
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => { load(); }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase.from('skills').select('*').order('sort_order');
    setSkills(data ?? []);
    // Extract unique categories from skills
    const uniqueCats = Array.from(new Set((data ?? []).map(s => s.category).filter(Boolean))).sort();
    // Ensure default categories exist
    const defaults = ['Design', 'Development', 'Data'];
    const allCats = Array.from(new Set([...defaults, ...uniqueCats])).sort();
    setCategories(allCats);
    // Count skills per category
    const counts: Record<string, number> = {};
    (data ?? []).forEach(s => { counts[s.category] = (counts[s.category] ?? 0) + 1; });
    setCatCounts(counts);
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

  const removeCategory = async (cat: string, reassignTo?: string) => {
    setBusy(true);
    setNote(null);
    if (reassignTo) {
      const { error } = await supabase.from('skills').update({ category: reassignTo }).eq('category', cat);
      if (error) {
        setBusy(false);
        setNote({ type: 'error', text: `Could not reassign skills: ${error.message}` });
        return;
      }
    }
    setBusy(false);
    setDeletingCat(null);
    setReassignTo('');
    load(true);
    setNote({ type: 'ok', text: reassignTo ? `Moved skills to "${reassignTo}" and removed "${cat}".` : `Removed "${cat}".` });
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
          categories={categories}
        />
      )}

      {/* Category management */}
      <div className="mt-8 border-t border-border pt-6">
        <h3 className="text-md font-semibold mb-3">Categories</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Categories with no skills can be removed. Default categories (Design, Development, Data) are always shown.
        </p>
        {note && (
          <p role="status" className={`mb-3 text-sm ${note.type === 'ok' ? 'text-success' : 'text-destructive'}`}>
            {note.text}
          </p>
        )}
        <ul className="space-y-2 max-w-md">
          {categories.map((cat) => {
            const count = catCounts[cat] ?? 0;
            const isDefault = ['Design', 'Development', 'Data'].includes(cat);
            return (
              <li key={cat} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{cat}</span>
                  <span className="text-sm text-muted-foreground">
                    {count === 0 ? 'No skills' : `${count} skill${count === 1 ? '' : 's'}`}
                  </span>
                  {isDefault && <span className="text-xs text-muted-foreground">(default)</span>}
                </div>
                {count === 0 && !isDefault && !busy && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`Remove category "${cat}"?`)) removeCategory(cat);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {count > 0 && !busy && deletingCat === cat && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Move skills to</span>
                    <select
                      value={reassignTo}
                      onChange={(e) => setReassignTo(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {categories.filter(c => c !== cat).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <Button size="sm" variant="destructive" onClick={() => removeCategory(cat, reassignTo)}>
                      Move & remove
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setDeletingCat(null); setReassignTo(''); }}>Cancel</Button>
                  </div>
                )}
                {count > 0 && !busy && deletingCat !== cat && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => { setDeletingCat(cat); setReassignTo(categories.find(c => c !== cat) ?? ''); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {busy && deletingCat === cat && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SkillForm({ skill, saving, onSave, onCancel, categories }: {
  skill: Partial<Skill>;
  saving: boolean;
  onSave: (s: any) => void;
  onCancel: () => void;
  categories: string[];
}) {
  const [name, setName] = useState(skill.name ?? '');
  const [category, setCategory] = useState(skill.category ?? 'Design');
  const [sortOrder, setSortOrder] = useState(skill.sort_order ?? 0);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleCategoryChange = (value: string) => {
    if (value === '__new__') {
      setShowNewCategory(true);
      setCategory(skill.category ?? 'Design');
    } else {
      setShowNewCategory(false);
      setCategory(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = showNewCategory ? newCategory.trim() : category;
    if (!finalCategory) return;
    onSave({ ...skill, name, category: finalCategory, sort_order: sortOrder });
    setShowNewCategory(false);
    setNewCategory('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <form
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{skill.id ? 'Edit skill' : 'New skill'}</h2>
          <button type="button" onClick={onCancel}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" /></div>
          <div>
            <Label>Category</Label>
            <Select value={showNewCategory ? '__new__' : category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
                <SelectItem value="__new__">+ Add new category…</SelectItem>
              </SelectContent>
            </Select>
            {showNewCategory && (
              <div className="mt-2 flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name"
                  autoFocus
                  maxLength={30}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => { setShowNewCategory(false); setNewCategory(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div><Label>Sort order</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="mt-1.5" /></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving || (showNewCategory && !newCategory.trim())}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
