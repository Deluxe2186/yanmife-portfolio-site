'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Skill, SkillDisplayCategory } from '@/lib/types';
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
  const [displayCategories, setDisplayCategories] = useState<SkillDisplayCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catCounts, setCatCounts] = useState<Record<string, number>>({});
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  // Display category management state
  const [editingDisplayCat, setEditingDisplayCat] = useState<SkillDisplayCategory | null>(null);
  const [creatingDisplayCat, setCreatingDisplayCat] = useState(false);
  const [savingDisplayCat, setSavingDisplayCat] = useState(false);
  const [displayCatNote, setDisplayCatNote] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

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
    // Load display categories
    const { data: displayCats } = await supabase
      .from('skill_display_categories')
      .select('*')
      .order('sort_order');
    setDisplayCategories(displayCats ?? []);
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

  // Display category management functions
  const saveDisplayCategory = async (cat: Partial<SkillDisplayCategory> & { name: string; description: string }) => {
    setSavingDisplayCat(true);
    setDisplayCatNote(null);
    if (cat.id) {
      await supabase.from('skill_display_categories').update(cat).eq('id', cat.id);
    } else {
      // Check if we already have 3 display categories
      if (displayCategories.length >= 3 && !cat.id) {
        setSavingDisplayCat(false);
        setDisplayCatNote({ type: 'error', text: 'Maximum 3 display categories allowed. Remove one first.' });
        return;
      }
      const nextOrder = Math.max(0, ...displayCategories.map(c => c.sort_order)) + 1;
      await supabase.from('skill_display_categories').insert({ ...cat, sort_order: nextOrder });
    }
    setSavingDisplayCat(false);
    setEditingDisplayCat(null);
    setCreatingDisplayCat(false);
    load(true);
  };

  const deleteDisplayCategory = async (id: string) => {
    if (!confirm('Remove this display category?')) return;
    setBusy(true);
    setDisplayCatNote(null);
    const { error } = await supabase.from('skill_display_categories').delete().eq('id', id);
    setBusy(false);
    if (error) {
      setDisplayCatNote({ type: 'error', text: `Could not remove: ${error.message}` });
      return;
    }
    load(true);
    setDisplayCatNote({ type: 'ok', text: 'Display category removed.' });
  };

  const reorderDisplayCategories = async (newOrder: SkillDisplayCategory[]) => {
    const renumbered = newOrder.map((c, i) => ({ ...c, sort_order: i + 1 }));
    const previous = displayCategories;
    setDisplayCategories(renumbered);
    const results = await Promise.all(
      renumbered
        .filter((c, i) => previous.find((p) => p.id === c.id)?.sort_order !== i + 1)
        .map((c) => supabase.from('skill_display_categories').update({ sort_order: c.sort_order }).eq('id', c.id))
    );
    if (results.some((r) => r.error)) {
      setDisplayCategories(previous);
      setDisplayCatNote({ type: 'error', text: 'Could not save new order. Try again.' });
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

      {/* Display category management (what shows on the public site) */}
      <div className="mt-8 border-t border-border pt-6">
        <h3 className="text-md font-semibold mb-3">Display Categories (Public Site)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose exactly 3 categories to show on the Skills section. Drag to reorder. These are separate from skill categories above.
        </p>
        {displayCatNote && (
          <p role="status" className={`mb-3 text-sm ${displayCatNote.type === 'ok' ? 'text-success' : 'text-destructive'}`}>
            {displayCatNote.text}
          </p>
        )}

        {/* Display category form */}
        {(editingDisplayCat || creatingDisplayCat) && (
          <DisplayCategoryForm
            cat={editingDisplayCat ?? { name: '', description: '', sort_order: 0 }}
            saving={savingDisplayCat}
            onSave={saveDisplayCategory}
            onCancel={() => { setEditingDisplayCat(null); setCreatingDisplayCat(false); }}
            canCreate={displayCategories.length < 3}
          />
        )}

        <ul className="space-y-2 max-w-md">
          {displayCategories.length === 0 ? (
            <li className="rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No display categories yet. Add your first one above (max 3).
            </li>
          ) : (
            displayCategories.map((cat, i) => (
              <li key={cat.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{cat.name}</span>
                  <span className="text-sm text-muted-foreground max-w-xs truncate">{cat.description ?? 'No description'}</span>
                  <span className="text-xs text-muted-foreground">Order: {cat.sort_order}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Move ${cat.name} up`} disabled={i === 0 || busy} onClick={() => {
                    const newOrder = [...displayCategories];
                    [newOrder[i], newOrder[i - 1]] = [newOrder[i - 1], newOrder[i]];
                    reorderDisplayCategories(newOrder);
                  }}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Move ${cat.name} down`} disabled={i === displayCategories.length - 1 || busy} onClick={() => {
                    const newOrder = [...displayCategories];
                    [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
                    reorderDisplayCategories(newOrder);
                  }}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditingDisplayCat(cat); setCreatingDisplayCat(false); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDisplayCategory(cat.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>

        {displayCategories.length < 3 && !creatingDisplayCat && !editingDisplayCat && (
          <Button size="sm" className="mt-4" onClick={() => setCreatingDisplayCat(true)}>
            <Plus className="mr-1.5 h-4 w-4" />Add display category
          </Button>
        )}
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

function DisplayCategoryForm({ cat, saving, onSave, onCancel, canCreate }: {
  cat: Partial<SkillDisplayCategory>;
  saving: boolean;
  onSave: (c: any) => void;
  onCancel: () => void;
  canCreate: boolean;
}) {
  const [name, setName] = useState(cat.name ?? '');
  const [description, setDescription] = useState(cat.description ?? '');
  const [sortOrder, setSortOrder] = useState(cat.sort_order ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ ...cat, name: name.trim(), description: description.trim(), sort_order: sortOrder });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <form
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{cat.id ? 'Edit display category' : 'New display category'}</h2>
          <button type="button" onClick={onCancel}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1.5" maxLength={30} /></div>
          <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown under the category name" className="mt-1.5" maxLength={80} /></div>
          <div><Label>Sort order</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="mt-1.5" /></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving || !name.trim() || !canCreate}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {!canCreate ? 'Max 3 reached' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
