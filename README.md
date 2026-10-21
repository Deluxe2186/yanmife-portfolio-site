# Yanmife — Personal Portfolio

A modern, fully responsive personal portfolio website for Yanmife Arayela, a UI/UX Designer and Web Developer based in Lagos, Nigeria.

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Database/Auth/Storage**: Supabase
- **Icons**: Lucide React, plus React Icons for brand logos
- **Fonts**: Inter (Google Fonts)

## Features

- Single-page portfolio with smooth scroll and scroll-spy navbar
- Hero with rotating role text and animated scroll hint
- Work section with category filtering and case study modals
- About section with animated count-up stats
- Skills section with grouped, staggered chips
- Experience timeline
- Social links row
- Working contact form (saves to Supabase)
- Admin dashboard at `/admin` for managing all content
- Light/dark mode toggle with system preference
- Custom cursor glow (desktop only)
- Scroll progress bar
- Page intro animation
- SEO optimized with Open Graph metadata
- Loading skeletons and empty/error states
- Fully accessible with prefers-reduced-motion support

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key

### 3. Create the database tables

1. In your Supabase dashboard, open **SQL Editor** → **New query**
2. Copy everything from `supabase/migrations/20261016211005_create_portfolio_schema.sql` and paste it in
3. Click **Run**
4. Check **Table Editor**: you should see `projects`, `skills`, `experience` and `messages`, and **Storage** should show a `project-images` bucket

The file also adds a few sample rows so the site is not empty. Replace them from `/admin`.

Then run any newer files in the same folder the same way, oldest first. For example `20261022090000_create_categories.sql` adds the Categories tab to the admin.

### 4. Set up Supabase Auth (for admin)

1. Go to your Supabase dashboard → Authentication → Users
2. Click "Add user" → "Create new user", enter an email and password, and tick "Auto Confirm User"
3. Then open Authentication → Sign In / Providers and turn **off** "Allow new users to sign up"
4. Use the credentials from step 2 to log in at `/admin`

Step 3 matters. The database rules let any logged-in user edit content and read messages, so sign-ups must stay closed.

### Admin sign-in and timeouts

- The sign-in lasts only while the tab is open. Closing the tab or the browser signs you out.
- After 15 minutes with no activity you get a warning, then you are signed out.
- A sign-in can never last longer than 8 hours, even if you stay active.

To change these, add to `.env` (and to Vercel): `NEXT_PUBLIC_ADMIN_IDLE_MINUTES=15` and `NEXT_PUBLIC_ADMIN_MAX_HOURS=8`.

These timers run in the browser. They protect an unattended screen, but they cannot stop someone who already has your password. Use a long, unique password.

### 5. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Build for production

```bash
npm run build
```

## Admin Dashboard

Navigate to `/admin` and sign in with your Supabase auth credentials. From there you can:

- **Projects**: Add, edit, delete, and reorder projects. Upload cover images to Supabase Storage.
- **Skills**: Add, edit, and delete skill entries grouped by category.
- **Experience**: Add, edit, delete, and reorder experience entries.
- **Profile**: Upload, replace or remove the photo shown in the About section.
- **Messages**: Read and delete contact form submissions.

## Database Schema

Four tables with Row Level Security:

| Table | Public Read | Public Write | Admin Only |
|-------|------------|-------------|------------|
| `projects` | Yes | No | Insert/Update/Delete |
| `skills` | Yes | No | Insert/Update/Delete |
| `experience` | Yes | No | Insert/Update/Delete |
| `messages` | No | Insert only | Read/Delete |

A public storage bucket `project-images` is used for project cover images and the profile photo.

## Keep-Alive

A GitHub Action (`.github/workflows/keep-alive.yml`) pings `/api/keep-alive` every 3 days to prevent the free Supabase project from pausing. Set `SITE_URL` in your GitHub repo secrets.

A Supabase Edge Function `keep-alive` is also deployed as a backup ping endpoint.

## Customization

Edit `lib/site-config.ts` to change:
- Your name, role, location, email
- Bio text
- Rotating role labels
- Stats (projects, years, tools)
- Social media links
- CV download URL

## Folder Structure

```
app/
  admin/          — Admin page
  api/keep-alive/ — Keep-alive API route
  globals.css     — Global styles + design tokens
  layout.tsx      — Root layout with providers
  page.tsx        — Main portfolio page
components/
  admin/          — Admin dashboard components
  sections/       — Portfolio page sections
  ui/             — shadcn/ui components
hooks/
  use-data.ts     — Data fetching hooks
lib/
  supabase/       — Supabase clients
  site-config.ts  — Site configuration
  types.ts        — TypeScript types
supabase/
  config.toml     — Supabase config
  functions/      — Edge functions
```

## License

Personal use. © Yanmife Arayela.
