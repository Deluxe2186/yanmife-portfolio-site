export interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  overview: string;
  description: string | null;
  cover_image_url: string | null;
  tools: string[];
  role: string | null;
  live_url: string | null;
  figma_url: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  sort_order: number;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  sort_order: number;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export type ProjectCategory = 'All' | 'Web' | 'Mobile' | 'Branding';
export type SkillCategory = 'Design' | 'Development' | 'Data';
