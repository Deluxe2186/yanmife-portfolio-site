/**
 * The same SQL as supabase/migrations/20261023090000_add_project_images.sql.
 * The admin page shows it when the database does not have the images column yet.
 */
export const PROJECT_IMAGES_SETUP_SQL = `ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS thumbnail_image_id text;
`;
