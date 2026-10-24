/*
  # Several images per project

  Each project can now hold a list of images, each with its own title,
  stored as JSON in the projects table:
    [{ "id": "...", "url": "...", "title": "..." }, ...]
  thumbnail_image_id says which of those images the thumbnail was made from.

  Run this once in the Supabase SQL Editor. It is safe to run again.
*/

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS thumbnail_image_id text;
