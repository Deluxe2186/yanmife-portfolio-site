-- Skill categories: controls which categories appear for skills (mirrors projects categories)
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

-- Seed with current defaults
INSERT INTO skill_categories (name, sort_order)
VALUES
  ('Design', 1),
  ('Development', 2),
  ('Data', 3)
ON CONFLICT (name) DO NOTHING;