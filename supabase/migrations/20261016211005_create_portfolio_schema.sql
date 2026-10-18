/*
# Portfolio Schema for Yanmife's Website

Creates 4 tables (projects, skills, experience, messages) plus a storage bucket for project cover images.

## Tables

### projects
- id, title, slug, category, overview, description, cover_image_url, tools (text[]), role, live_url, figma_url, featured, sort_order, created_at

### skills
- id, name, category, sort_order

### experience
- id, role, company, start_date, end_date, description, sort_order

### messages
- id, name, email, message, created_at

## Security (RLS)
- projects, skills, experience: public read (anon + authenticated), admin-only write (authenticated)
- messages: anyone can insert (anon + authenticated), only authenticated can read, no update/delete from anon

## Storage
- public bucket "project-images"
*/

-- ============ PROJECTS ============
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'Web',
  overview text NOT NULL,
  description text,
  cover_image_url text,
  tools text[] DEFAULT '{}',
  role text,
  live_url text,
  figma_url text,
  featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_projects" ON projects;
CREATE POLICY "public_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_projects" ON projects;
CREATE POLICY "admin_insert_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_projects" ON projects;
CREATE POLICY "admin_update_projects" ON projects FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_projects" ON projects;
CREATE POLICY "admin_delete_projects" ON projects FOR DELETE
  TO authenticated USING (true);

-- ============ SKILLS ============
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Design',
  sort_order integer DEFAULT 0
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_skills" ON skills;
CREATE POLICY "public_select_skills" ON skills FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_skills" ON skills;
CREATE POLICY "admin_insert_skills" ON skills FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_skills" ON skills;
CREATE POLICY "admin_update_skills" ON skills FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_skills" ON skills;
CREATE POLICY "admin_delete_skills" ON skills FOR DELETE
  TO authenticated USING (true);

-- ============ EXPERIENCE ============
CREATE TABLE IF NOT EXISTS experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  company text NOT NULL,
  start_date text NOT NULL,
  end_date text,
  description text,
  sort_order integer DEFAULT 0
);

ALTER TABLE experience ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_experience" ON experience;
CREATE POLICY "public_select_experience" ON experience FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_experience" ON experience;
CREATE POLICY "admin_insert_experience" ON experience FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_experience" ON experience;
CREATE POLICY "admin_update_experience" ON experience FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_experience" ON experience;
CREATE POLICY "admin_delete_experience" ON experience FOR DELETE
  TO authenticated USING (true);

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_messages" ON messages;
CREATE POLICY "admin_read_messages" ON messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_delete_messages" ON messages;
CREATE POLICY "admin_delete_messages" ON messages FOR DELETE
  TO authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS projects_sort_idx ON projects (sort_order);
CREATE INDEX IF NOT EXISTS skills_sort_idx ON skills (sort_order);
CREATE INDEX IF NOT EXISTS experience_sort_idx ON experience (sort_order);
CREATE INDEX IF NOT EXISTS messages_created_idx ON messages (created_at DESC);

-- ============ SEED DATA ============
INSERT INTO projects (title, slug, category, overview, description, cover_image_url, tools, role, live_url, figma_url, featured, sort_order)
VALUES
  ('Sample: Mobile Money App', 'sample-mobile-money-app', 'Mobile',
   'Sample project. Replace this with a one-line summary of your real work.',
   'Sample case study. Replace this text from the admin page with your real project story: the problem, your process, and the result.',
   'https://images.pexels.com/photos/5342168/pexels-photo-5342168.jpeg',
   ARRAY['Figma', 'Prototyping', 'Wireframing'],
   'Your role here',
   NULL, NULL, true, 1),
  ('Sample: Web Dashboard', 'sample-web-dashboard', 'Web',
   'Sample project. Replace this with a one-line summary of your real work.',
   'Sample case study. Replace this text from the admin page with your real project story: the problem, your process, and the result.',
   'https://images.pexels.com/photos/7681091/pexels-photo-7681091.jpeg',
   ARRAY['Next.js', 'React', 'Tailwind CSS', 'Figma'],
   'Your role here',
   NULL, NULL, true, 2),
  ('Sample: Brand Identity', 'sample-brand-identity', 'Branding',
   'Sample project. Replace this with a one-line summary of your real work.',
   'Sample case study. Replace this text from the admin page with your real project story: the problem, your process, and the result.',
   'https://images.pexels.com/photos/6804077/pexels-photo-6804077.jpeg',
   ARRAY['Figma', 'Branding', 'Typography'],
   'Your role here',
   NULL, NULL, false, 3),
  ('Sample: Checkout Flow', 'sample-checkout-flow', 'Web',
   'Sample project. Replace this with a one-line summary of your real work.',
   'Sample case study. Replace this text from the admin page with your real project story: the problem, your process, and the result.',
   'https://images.pexels.com/photos/4458/cellphone-smartphone-photo-concentration.jpg',
   ARRAY['Figma', 'Prototyping', 'Wireframing'],
   'Your role here',
   NULL, NULL, false, 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO skills (name, category, sort_order)
VALUES
  ('Figma', 'Design', 1),
  ('UI/UX Design', 'Design', 2),
  ('Wireframing', 'Design', 3),
  ('Prototyping', 'Design', 4),
  ('Next.js', 'Development', 5),
  ('React', 'Development', 6),
  ('CSS', 'Development', 7),
  ('Tailwind CSS', 'Development', 8),
  ('Excel', 'Data', 9),
  ('Pivot Tables', 'Data', 10),
  ('Data Cleaning', 'Data', 11),
  ('Data Normalization', 'Data', 12)
ON CONFLICT DO NOTHING;

INSERT INTO experience (role, company, start_date, end_date, description, sort_order)
VALUES
  ('UI/UX Design Intern', 'MomoPSB', '2024-01', '2024-06',
   'Sample description. Edit this from the admin page to describe what you actually did.', 1),
  ('Freelance Web Developer & Designer', 'Self-employed', '2023-06', NULL,
   'Sample description. Edit this from the admin page to describe your freelance work.', 2)
ON CONFLICT DO NOTHING;

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read, authenticated can upload/update/delete
DROP POLICY IF EXISTS "public_read_project_images" ON storage.objects;
CREATE POLICY "public_read_project_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "admin_upload_project_images" ON storage.objects;
CREATE POLICY "admin_upload_project_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images');

DROP POLICY IF EXISTS "admin_update_project_images" ON storage.objects;
CREATE POLICY "admin_update_project_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "admin_delete_project_images" ON storage.objects;
CREATE POLICY "admin_delete_project_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-images');