'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Copy, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { CATEGORIES_SETUP_SQL } from '@/lib/categories-sql';
import { useCategories } from '@/hooks/use-data';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type Note = { type: 'ok' | 'error'; text: string } | null;

const clean = (value: string) => value.trim().replace(/\s+/g, ' ');

export function CategoriesManager() {
  const { categories: rows, setCategories, loading, tableMissing, reload } = useCategories();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const [copied, setCopied] = useState(false);

  const loadCounts = async () => {
    const { data } = await supabase.from('projects').select('category');
    const next: Record<string, number> = {};
    (data ?? []).forEach((p: { category: string }) => {
      if (p.category) next[p.category] = (next[p.category] ?? 0) + 1;
    });
    setCounts(next);
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const nameError = (name: string, ignoreId?: string): string | null => {
    if (!name) return 'Type a name first.';
    if (name.length > 30) return 'Keep it under 30 characters.';
    if (name.toLowerCase() === 'all') return '"All" is added automatically.';
    if (rows.some((r) => r.id !== ignoreId && r.name.toLowerCase() === name.toLowerCase())) {
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
    const next = Math.max(0, ...rows.map((r) => r.sort_order)) + 1;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, sort_order: next })
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      setNote({ type: 'error', text: `Could not add it: ${error?.message ?? 'unknown error'}` });
      return false;
    }
    setCategories((prev) => [...prev, data as Category]);
    setNote({ type: 'ok', text: `Added "${name}". Choose it for a project in the Projects tab.` });
    return true;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setNote(null);
    if (await addCategory(clean(newName))) setNewName('');
  };

  const saveRename = async (row: Category) => {
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
    const first = await supabase.from('categories').update({ name }).eq('id', row.id);
    if (first.error) {
      setBusy(false);
      setNote({ type: 'error', text: `Could not rename it: ${first.error.message}` });
      return;
    }
    // Projects store the category name, so move them to the new name too.
    const second = await supabase.from('projects').update({ category: name }).eq('category', row.name);
    if (second.error) {
      await supabase.from('categories').update({ name: row.name }).eq('id', row.id);
      setBusy(false);
      setNote({ type: 'error', text: `Could not update the projects, so nothing was renamed: ${second.error.message}` });
      return;
    }
    setBusy(false);
    setCategories((prev) => prev.map((r) => (r.id === row.id ? { ...r, name } : r)));
    setRenamingId(null);
    setNote({ type: 'ok', text: `Renamed to "${name}".` });
    loadCounts();
  };

  const startRemove = (row: Category) => {
    setNote(null);
    const used = counts[row.name] ?? 0;
    if (used === 0) {
      if (confirm(`Remove the category "${row.name}"?`)) doRemove(row, null);
      return;
    }
    const others = rows.filter((r) => r.id !== row.id);
    if (others.length === 0) {
      setNote({ type: 'error', text: `Add another category first, so the ${used} project${used === 1 ? '' : 's'} using "${row.name}" have somewhere to go.` });
      return;
    }
    setRemovingId(row.id);
    setMoveTo(others[0].name);
  };

  const doRemove = async (row: Category, moveProjectsTo: string | null) => {
    setBusy(true);
    if (moveProjectsTo) {
      const moved = await supabase.from('projects').update({ category: moveProjectsTo }).eq('category', row.name);
      if (moved.error) {
        setBusy(false);
        setNote({ type: 'error', text: `Could not move the projects: ${moved.error.message}` });
        return;
      }
    }
    const { error } = await supabase.from('categories').delete().eq('id', row.id);
    setBusy(false);
    if (error) {
      setNote({ type: 'error', text: `Could not remove it: ${error.message}` });
      return;
    }
    setCategories((prev) => prev.filter((r) => r.id !== row.id));
    setRemovingId(null);
    setNote({
      type: 'ok',
      text: moveProjectsTo ? `Removed "${row.name}". Its projects moved to "${moveProjectsTo}".` : `Removed "${row.name}".`,
    });
    loadCounts();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const reordered = [...rows];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const renumbered = reordered.map((r, i) => ({ ...r, sort_order: i + 1 }));
    const previous = rows;
    setCategories(renumbered);
    const results = await Promise.all(
      renumbered
        .filter((r, i) => previous.find((p) => p.id === r.id)?.sort_order !== i + 1)
        .map((r) => supabase.from('categories').update({ sort_order: r.sort_order }).eq('id', r.id))
    );
    if (results.some((r) => r.error)) {
      setCategories(previous);
      setNote({ type: 'error', text: 'Could not save the new order. Try again.' });
    }
  };

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(CATEGORIES_SETUP_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNote({ type: 'error', text: 'Could not copy. Select the text and copy it by hand.' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
          Categories need one small table in your database. In Supabase, open <strong>SQL Editor</strong>, choose{' '}
          <strong>New query</strong>, paste this and click <strong>Run</strong>. Then come back and press the button below.
        </p>
        <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-card p-4 text-xs">{CATEGORIES_SETUP_SQL}</pre>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={copySql}>
            {copied ? <Check className="mr-1.5 h-4 w-4 text-success" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy the SQL'}
          </Button>
          <Button type="button" onClick={() => { setNote(null); reload(); }}>
            I ran it, check again
          </Button>
        </div>
        {note && <p className="text-sm text-destructive">{note.text}</p>}
      </div>
    );
  }

  const orphans = Object.keys(counts).filter((name) => !rows.some((r) => r.name === name));

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Categories ({rows.length})</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These become the filter buttons in your Work section, in this order. A category with no projects stays hidden on the site.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category, for example Illustration"
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
        {rows.length === 0 && (
          <li className="rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No categories yet. Add your first one above.
          </li>
        )}
        {rows.map((row, i) => {
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
                        {used === 0 ? 'No projects yet' : `${used} project${used === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label={`Move ${row.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Move ${row.name} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
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
                    {used} project{used === 1 ? '' : 's'} use{used === 1 ? 's' : ''} this. Move {used === 1 ? 'it' : 'them'} to
                  </span>
                  <select
                    value={moveTo}
                    onChange={(e) => setMoveTo(e.target.value)}
                    aria-label="Move projects to"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {rows.filter((r) => r.id !== row.id).map((r) => (
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
          <p className="font-medium">Used by projects but not in your list</p>
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
  );
}
