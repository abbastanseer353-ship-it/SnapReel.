# Hunar 🎬💼

A TikTok-style short-video web app **plus** an **Earning** marketplace where clients and
workers connect, share skills, and chat in real time.

Built with **React + Vite + TypeScript**, **Supabase** (auth, database, realtime) and
**Cloudinary** (video hosting).

## Features

- 🔐 **Auth** — email/password sign up & login (Supabase Auth)
- 📹 **Video feed** — full-screen vertical scroll feed with autoplay, like & comment
- ⬆️ **Upload** — upload videos to Cloudinary with progress bar + caption
- 👤 **Profiles** — avatar, bio, role (client / worker / both), skills, followers/following, video grid
- 💼 **Earning** — post skills you *offer* or work you *request* (with budget), browse & filter
- 💬 **Chat** — real-time 1-to-1 messaging between clients and workers (Supabase Realtime)

## Tech stack

| Layer     | Choice                       |
| --------- | ---------------------------- |
| Frontend  | React 19 + Vite + TypeScript |
| Routing   | react-router-dom             |
| Backend   | Supabase (Postgres + Auth + Realtime) |
| Media     | Cloudinary (unsigned upload) |

## Getting started

### 1. Prerequisites

- Node.js **22.12+** (see `.nvmrc` → run `nvm use`)

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
```

- **Supabase**: Project → Settings → API → copy the *Project URL* and *anon public* key.
- **Cloudinary**: Dashboard → the *Cloud name* is on the home page. Then
  Settings → Upload → *Add upload preset* → set **Signing Mode = Unsigned** and copy its name.

### 4. Set up the database

Open the Supabase **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
This creates all tables, row-level-security policies, the auto-profile trigger, and enables
realtime for chat.

### 5. Run

```bash
npm run dev
```

Visit the printed URL (default http://localhost:5173).

## Scripts

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start the dev server              |
| `npm run build`   | Type-check + production build      |
| `npm run lint`    | Lint the codebase (oxlint)        |
| `npm run preview` | Preview the production build       |

## Project structure

```
src/
  components/   Reusable UI (VideoCard, CommentsSheet, Layout, …)
  context/      AuthContext (session + profile)
  lib/          supabase client, cloudinary upload, shared types
  pages/        Auth, Feed, Upload, Profile, Earning, Messages, Chat
supabase/
  schema.sql    Database schema + RLS + triggers
```

## Notes

- Videos are stored on Cloudinary; only their URLs live in Supabase.
- Uploads use an **unsigned** Cloudinary preset so no secret key is exposed in the browser.
- All tables are protected with Row Level Security — users can only modify their own data,
  and messages are only visible to their two participants.
