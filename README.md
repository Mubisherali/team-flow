# TeamFlow

A full-stack SaaS project management platform for startups and dev teams.

## 📋 Overview

TeamFlow helps teams organize their work through workspaces, projects, and tasks. Features include a Kanban board with drag-and-drop, task discussions, member management, real-time notifications, analytics dashboards, and a command palette for fast navigation.

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), JavaScript, TailwindCSS
- **Backend:** Next.js API routes
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Auth:** NextAuth v4 (Credentials + Google + GitHub OAuth)
- **Email:** Resend
- **Media:** Cloudinary (avatars)
- **Drag & Drop:** @dnd-kit
- **Motion:** Framer Motion
- **Toasts:** react-hot-toast
- **Icons:** lucide-react
- **Validation:** Zod
- **Charts:** Recharts
- **Command Palette:** cmdk
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (or a free Neon account)

### Installation

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd team-flow

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Then fill in all the values (see .env.example)

# 4. Set up the database
npx prisma migrate dev

# 5. Start the dev server
npm run dev