'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowDown, ArrowUp, Check, Copy, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useSkills } from '@/hooks/use-data';
import { useSkillCategories } from '@/hooks/use-data';
import type { Skill, SkillCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const clean = (value: string) => value.trim().replace(/\s+/g, ' ');

export function SkillsManager() {
  // Skills data
  const { skills, setSkills, loading: skillsLoading, error: skillsError } = useSkills();
  // Skill categories data
  const { categories: skillCategories, setCategories: setSkillCategories, loading: catsLoading, tableMissing, reload: reloadCats } = useSkillCategories();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Category management state
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const [copied, setCopied] = useState(false);

  // Load skills and counts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Load skill categories first
      await reloadCats();
      // Load skills
      const { data } = await supabase.from('skills').select('*').order('sort_order');
      setSkills(data ?? []);
      // Count skills per category
      const next: Record<string, number> = {};
      (data ?? []).forEach((s: { category: string }) => {
        if (s.category) next[s.category] = (next[s.category] ?? 0) + 1;
      });
      setCounts(next);
      setLoading(false);
    };
    loadData();
  }, [reloadCats, setSkills]);

  const nameError = (name: string, ignoreId?: string): string | null => {
    if (!name) return 'Type a name first.';
    if (name.length > 30) return 'Keep it under 30 characters.';
    if (name.toLowerCase() === 'all') return '"All" is reserved.';
    if (skillCategories.some((r) => r.id !== ignoreId && r.name.toLowerCase() === name.toLowerCase())) {
      return 'That category already exists.';
    }
    return null;
  };

  const addCategory = async (name: string) => {
    const problem = nameError(name);
    if (problem) {
      setNote({ type: 'error', text: problem });
      return false;
    }
    setBusy(true);
    const next = Math.max(0, ...skillCategories.map((r) => r.sort_order)) + 1;
    const { data, error } = await supabase
      .from('skill_categories')
      .insert({ name, sort_order: next })
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      setNote({ type: 'error', text: `Could not add it: ${error?.message ?? 'unknown error'}` });
      return false;
    }
    setSkillCategories((prev) => [...prev, data as SkillCategory]);
    setNote({ type: 'ok', text: `Added "${name}". Choose it for a skill in the Skills tab.` });
    return true;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setNote(null);
    if (await addCategory(clean(newName))) setNewName('');
  };

  const saveRename = async (row: SkillCategory) => {
    const name = clean(renameValue);
    if (name === row.name) {
      setRenamingId(null);
      return;
    }
    const problem = nameError(name, row.id);
    if (problem) {
      setNote({ type: 'error', text: problem });
      return;
    }
    setBusy(true);
    setNote(null);
    const first = await supabase.from('skill_categories').update({ name }).eq('id', row.id);
    if (first.error) {
      setBusy(false);
      setNote({ type: 'error', text: `Could not rename it: ${first.error.message}` });
      return;
    }
    // Skills store the category name, so move them to the new name too.
    const second = await supabase.from('skills').update({ category: name }).eq('category', row.name);
    if (second.error) {
      await supabase.from('skill_categories').update({ name: row.name }).eq('id', row.id);
      setBusy(false);
      setNote({ type: 'error', text: `Could not update the skills, so nothing was renamed: ${second.error.message}` });
      return;
    }
    setBusy(false);
    setSkillCategories((prev) => prev.map((r) => (r.id === row.id ? { ...r, name } : r)));
    setRenamingId(null);
    setNote({ type: 'ok', text: `Renamed to "${name}".` });
    // Reload counts
    const { data } = await supabase.from('skills').select('category');
    const next: Record<string, number> = {};
    (data ?? []).forEach((s: { category: string }) => {
      if (s.category) next[s.category] = (next[s.category] ?? 0) + 1;
    });
    setCounts(next);
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Delete this skill?')) return;
    const previous = skills;
    setSkills((prev: Skill[]) => prev.filter((item: Skill) => item.id !== id));
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (error) {
      setSkills(previous);
      alert(`Could not delete: ${error.message}`);
    }
  };

  const startRemove = (row: SkillCategory) => {
    setNote(null);
    const used = counts[row.name] ?? 0;
    if (used === 0) {
      if (confirm(`Remove the category "${row.name}"?`)) doRemove(row, null);
      return;
    }
    const others = skillCategories.filter((r) => r.id !== row.id);
    if (others.length === 0) {
      setNote({ type: 'error', text: `Add another category first, so the ${used} skill${used === 1 ? '' : 's'} using "${row.name}" have somewhere to go.` });
      return;
    }
    setRemovingId(row.id);
    setMoveTo(others[0].name);
  };

  const doRemove = async (row: SkillCategory, moveSkillsTo: string | null) => {
    setBusy(true);
    if (moveSkillsTo) {
      const moved = await supabase.from('skills').update({ category: moveSkillsTo }).eq('category', row.name);
      if (moved.error) {
        setBusy(false);
        setNote({ type: 'error', text: `Could not move the skills: ${moved.error.message}` });
        return;
      }
    }
    const { error } = await supabase.from('skill_categories').delete().eq('id', row.id);
    setBusy(false);
    if (error) {
      setNote({ type: 'error', text: `Could not remove it: ${error.message}` });
      return;
    }
    setSkillCategories((prev) => prev.filter((r) => r.id !== row.id));
    setRemovingId(null);
    setNote({
      type: 'ok',
      text: moveSkillsTo ? `Removed "${row.name}". Its skills moved to "${moveSkillsTo}".` : `Removed "${row.name}".`,
    });
    // Reload counts
    const { data } = await supabase.from('skills').select('category');
    const next: Record<string, number> = {};
    (data ?? []).forEach((s: { category: string }) => {
      if (s.category) next[s.category] = (next[s.category] ?? 0) + 1;
    });
    setCounts(next);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= skillCategories.length) return;
    const reordered = [...skillCategories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const renumbered = reordered.map((r, i) => ({ ...r, sort_order: i + 1 }));
    const previous = skillCategories;
    setSkillCategories(renumbered);
    const results = await Promise.all(
      renumbered
        .filter((r, i) => previous.find((p) => p.id === r.id)?.sort_order !== i + 1)
        .map((r) => supabase.from('skill_categories').update({ sort_order: r.sort_order }).eq('id', r.id))
    );
    if (results.some((r) => r.error)) {
      setSkillCategories(previous);
      setNote({ type: 'error', text: 'Could not save the new order. Try again.' });
    }
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(`
-- Skill categories table (run in Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
      `);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNote({ type: 'error', text: 'Could not copy. Select the text and copy it by hand.' });
    }
  };

  if (loading || skillsLoading || catsLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (tableMissing) {
    return (
      <div className="max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold">One-time setup</h2>
        <p className="text-sm text-muted-foreground">
          Skill categories need one small table in your database. In Supabase, open <strong>SQL Editor</strong>, choose{' '}
          <strong>New query</strong>, paste this and click <strong>Run</strong>. Then come back and press the button below.
        </p>
        <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-card p-4 text-xs">
{`-- Skill categories table
CREATE TABLE IF NOT EXISTS skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_skill_categories" ON skill_categories;
CREATE POLICY "public_select_skill_categories" ON skill_categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_skill_categories" ON skill_categories;
CREATE POLICY "admin_insert_skill_categories" ON skill_categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_skill_categories" ON skill_categories;
CREATE POLICY "admin_update_skill_categories" ON skill_categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_skill_categories" ON skill_categories;
CREATE POLICY "admin_delete_skill_categories" ON skill_categories FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS skill_categories_sort_idx ON skill_categories (sort_order);

-- Seed with defaults
INSERT INTO skill_categories (name, sort_order)
VALUES
  ('Design', 1),
  ('Development', 2),
  ('Data', 3)
ON CONFLICT (name) DO NOTHING;`}
        </pre>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={copySql}>
            {copied ? <Check className="mr-1.5 h-4 w-4 text-success" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy the SQL'}
          </Button>
          <Button type="button" onClick={() => { setNote(null); reloadCats(); }}>
            I ran it, check again
          </Button>
        </div>
        {note && <p className="text-sm text-destructive">{note.text}</p>}
      </div>
    );
  }

  // Find orphan categories (used by skills but not in the list)
  const orphans = Object.keys(counts).filter((name) => !skillCategories.some((r) => r.name === name));

  return (
    <div className="max-w-2xl">
      {/* Skills list */}
      <div className="mb-8">
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
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSkill(skill.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))
          )}
        </div>

        {(editing || creating) && (
          <SkillForm
            skill={editing ?? { name: '', category: skillCategories[0]?.name ?? 'Design', sort_order: 0 }}
            saving={saving}
            onSave={async (skill: Partial<Skill> & { name: string; category: string }) => {
              setSaving(true);
              if (skill.id) {
                await supabase.from('skills').update(skill).eq('id', skill.id);
              } else {
                await supabase.from('skills').insert(skill);
              }
              setSaving(false);
              setEditing(null);
              setCreating(false);
              // Reload skills
              const { data } = await supabase.from('skills').select('*').order('sort_order');
              setSkills(data ?? []);
              // Reload counts
              const countsNext: Record<string, number> = {};
              (data ?? []).forEach((s: { category: string }) => {
                if (s.category) countsNext[s.category] = (countsNext[s.category] ?? 0) + 1;
              });
              setCounts(countsNext);
            }}
            onCancel={() => { setEditing(null); setCreating(false); }}
            categories={skillCategories.map(c => c.name)}
          />
        )}
      </div>

      {/* Category management - identical to projects categories */}
      <div className="border-t border-border pt-6">
        <h3 className="text-md font-semibold mb-3">Skill Categories</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These become the groups in your Skills section, in this order. A category with no skills stays hidden on the site.
        </p>

        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category, for example Motion"
            aria-label="New category name"
            maxLength={30}
          />
          <Button type="submit" disabled={busy || !newName.trim()}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            Add
          </Button>
        </form>

        {note && (
          <p role="status" className={`mt-3 text-sm ${note.type === 'ok' ? 'text-success' : 'text-destructive'}`}>
            {note.text}
          </p>
        )}

        <ul className="mt-5 space-y-2">
          {skillCategories.length === 0 && (
            <li className="rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No categories yet. Add your first one above.
            </li>
          )}
          {skillCategories.map((row, i) => {
            const used = counts[row.name] ?? 0;
            return (
              <li key={row.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  {renamingId === row.id ? (
                    <form
                      className="flex flex-1 gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveRename(row);
                      }}
                    >
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        aria-label={`New name for ${row.name}`}
                        maxLength={30}
                      />
                      <Button type="submit" size="sm" disabled={busy}>Save</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {used === 0 ? 'No skills yet' : `${used} skill${used === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" aria-label={`Move ${row.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Move ${row.name} down`} disabled={i === skillCategories.length - 1} onClick={() => move(i, 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Rename ${row.name}`}
                        onClick={() => {
                          setRenamingId(row.id);
                          setRenameValue(row.name);
                          setRemovingId(null);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Remove ${row.name}`} onClick={() => startRemove(row)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>

                {removingId === row.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-3 text-sm">
                    <span>
                      {used} skill{used === 1 ? '' : 's'} use{used === 1 ? 's' : ''} this. Move {used === 1 ? 'it' : 'them'} to
                    </span>
                    <select
                      value={moveTo}
                      onChange={(e) => setMoveTo(e.target.value)}
                      aria-label="Move skills to"
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {skillCategories.filter((r) => r.id !== row.id).map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => doRemove(row, moveTo)}>
                      {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                      Move and remove
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRemovingId(null)}>Cancel</Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {orphans.length > 0 && (
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Used by skills but not in your list</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {orphans.map((name) => (
                <Button key={name} size="sm" variant="outline" disabled={busy} onClick={() => addCategory(name)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {name}
                </Button>
              ))}
            </div>
          </div>
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
  const [category, setCategory] = useState(skill.category ?? (categories[0] ?? 'Design'));
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
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
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