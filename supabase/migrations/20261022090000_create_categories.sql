/*
  # Project categories

  Lets you add, rename, reorder and remove project categories from the
  admin page (Admin > Categories). Anyone can read the list. Only the
  signed-in admin can change it.

  Run this once in the Supabase SQL Editor. It is safe to run again.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_categories" ON categories;
CREATE POLICY "public_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE
  TO authenticated USING (true);

INSERT INTO categories (name, sort_order)
VALUES ('Web', 1), ('Mobile', 2), ('Branding', 3)
ON CONFLICT (name) DO NOTHING;

-- Keep any category your projects already use.
INSERT INTO categories (name, sort_order)
SELECT DISTINCT category, 100 FROM projects
WHERE category IS NOT NULL AND category <> ''
ON CONFLICT (name) DO NOTHING;
