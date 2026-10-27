-- Skill display categories: controls which 3 categories appear on the public skills section
-- and their order/descriptions. Distinct from the free-form skill.category values.
CREATE TABLE IF NOT EXISTS skill_display_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skill_display_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_skill_display_categories" ON skill_display_categories;
CREATE POLICY "public_select_skill_display_categories" ON skill_display_categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_skill_display_categories" ON skill_display_categories;
CREATE POLICY "admin_insert_skill_display_categories" ON skill_display_categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_skill_display_categories" ON skill_display_categories;
CREATE POLICY "admin_update_skill_display_categories" ON skill_display_categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_skill_display_categories" ON skill_display_categories;
CREATE POLICY "admin_delete_skill_display_categories" ON skill_display_categories FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS skill_display_categories_sort_idx ON skill_display_categories (sort_order);

-- Seed with current defaults
INSERT INTO skill_display_categories (name, description, sort_order)
VALUES
  ('Design', 'What I use to design screens and flows.', 1),
  ('Development', 'What I build with.', 2),
  ('Data', 'What I use to clean up messy data.', 3)
ON CONFLICT (name) DO NOTHING;