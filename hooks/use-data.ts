'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { fetchProfilePhoto } from '@/lib/profile-photo';
import { fetchCv, type Cv } from '@/lib/cv';
import type { Project, Skill, Experience, Category, SkillCategory } from '@/lib/types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error('[supabase]', error);
        setError(error.message);
      }
      else setProjects(data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { projects, loading, error, setProjects };
}

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error('[supabase]', error);
        setError(error.message);
      }
      else setSkills(data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { skills, setSkills, loading, error };
}

export function useExperience() {
  const [experience, setExperience] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('experience')
        .select('*')
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error('[supabase]', error);
        setError(error.message);
      }
      else setExperience(data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { experience, loading, error };
}

export function useProfilePhoto() {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const photo = await fetchProfilePhoto();
        if (!cancelled) setUrl(photo.url);
      } catch (err) {
        console.error('[supabase] profile photo', err);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { url, loading };
}

export function useCv() {
  const [cv, setCv] = useState<Cv | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await fetchCv();
        if (!cancelled) setCv(found);
      } catch (err) {
        console.error('[supabase] cv', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return cv;
}

/** True when Supabase says the categories table does not exist yet. */
export function isMissingCategoriesTable(error: { code?: string; message?: string }) {
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    /categories/i.test(error.message ?? '') && /schema cache|does not exist/i.test(error.message ?? '')
  );
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      const missing = isMissingCategoriesTable(error);
      if (!missing) console.error('[supabase] categories', error);
      setTableMissing(missing);
      setCategories([]);
    } else {
      setTableMissing(false);
      setCategories(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, setCategories, loading, tableMissing, reload };
}

export function useSkillCategories() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('skill_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      const missing = isMissingCategoriesTable(error);
      if (!missing) console.error('[supabase] skill_categories', error);
      setTableMissing(missing);
      setCategories([]);
    } else {
      setTableMissing(false);
      setCategories(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, setCategories, loading, tableMissing, reload };
}
