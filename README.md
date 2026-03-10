# MeetSync — Smart Meeting Scheduler

A modern SaaS-style meeting scheduling platform built with **Next.js**, **Supabase**, **TailwindCSS**, and **Framer Motion**. Similar to Doodle or When2Meet but with a modern animated UI.

## Features

- **Google OAuth Login** — Sign in with Google via Supabase Auth
- **Group Creation** — Create groups for teams, projects, or social events
- **Email Invitations** — Invite members by email, auto-accept for existing users
- **Availability Grid** — Interactive grid to mark available time slots
- **Smart Scheduling** — Algorithm finds the optimal meeting time
- **Meeting Confirmation** — Admins confirm the best slot
- **Real-time Notifications** — Supabase realtime for instant updates
- **Dark/Light Mode** — Full theme support
- **Responsive Design** — Mobile-friendly with touch interactions
- **Row Level Security** — Secure data access policies

## Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | Next.js 16 (App Router), TypeScript |
| Styling    | TailwindCSS 4, Framer Motion     |
| Backend    | Supabase (Auth + PostgreSQL + Realtime) |
| Deployment | Vercel                            |

## Project Structure

```
smart-meeting-scheduler/
├── src/
│   ├── app/
│   │   ├── auth/callback/route.ts    # OAuth callback
│   │   ├── dashboard/page.tsx        # User dashboard
│   │   ├── groups/[id]/page.tsx      # Group page (availability, members, results)
│   │   ├── login/page.tsx            # Login page
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles & CSS variables
│   ├── components/
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── skeleton.tsx
│   │   ├── navbar.tsx                # Navigation bar
│   │   ├── theme-provider.tsx        # Dark/light mode provider
│   │   └── theme-toggle.tsx          # Theme toggle button
│   ├── hooks/
│   │   ├── use-auth.ts               # Authentication hook
│   │   ├── use-availability.ts       # Availability management + best slot algorithm
│   │   ├── use-groups.ts             # Group CRUD operations
│   │   ├── use-meetings.ts           # Meeting scheduling
│   │   └── use-notifications.ts      # Real-time notifications
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   ├── middleware.ts         # Session management
│   │   │   └── server.ts            # Server Supabase client
│   │   └── utils.ts                  # Utility functions (cn)
│   ├── types/
│   │   └── index.ts                  # TypeScript types
│   └── middleware.ts                 # Next.js middleware
├── supabase-schema.sql               # Database schema & RLS policies
├── .env.local                        # Environment variables
├── next.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A [Supabase](https://supabase.com) account
- A Google Cloud project with OAuth credentials

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd smart-meeting-scheduler
npm install
```

### 3. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase-schema.sql` and run it.
4. Go to **Authentication > Providers > Google** and enable it:
   - Add your Google Client ID and Client Secret
   - Set the redirect URL to: `https://your-project.supabase.co/auth/v1/callback`
5. Go to **Settings > API** and copy your:
   - Project URL
   - Anon/public key

### 4. Configure Environment Variables

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase Dashboard > Auth > Providers > Google

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Schema

### Tables

| Table            | Purpose                              |
| ---------------- | ------------------------------------ |
| `users`          | User profiles (synced from auth)     |
| `groups`         | Meeting groups                       |
| `group_members`  | Group membership with roles          |
| `invites`        | Email invitations                    |
| `availability`   | Time slot availability per member    |
| `meetings`       | Confirmed meeting times              |
| `notifications`  | User notifications (realtime)        |

### Row Level Security

All tables have RLS enabled with policies ensuring:
- Users can only read groups they belong to
- Users can only modify their own availability
- Only admins can create invites and confirm meetings
- Notifications are private to each user

## Deployment

### GitHub

```bash
git init
git add .
git commit -m "Initial commit: Smart Meeting Scheduler"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-meeting-scheduler.git
git push -u origin main
```

### Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy!

The site URL from Vercel should be added to:
- Supabase Auth > URL Configuration > Site URL
- Supabase Auth > URL Configuration > Redirect URLs
- Google Cloud Console > OAuth 2.0 > Authorized redirect URIs

## Pages

| Page               | Route           | Description                              |
| ------------------ | --------------- | ---------------------------------------- |
| Landing Page       | `/`             | Hero, features, how it works, CTA        |
| Login              | `/login`        | Google OAuth sign-in                     |
| Dashboard          | `/dashboard`    | Groups list, notifications, create group |
| Group              | `/groups/[id]`  | Availability grid, members, best times   |

## License

MIT
