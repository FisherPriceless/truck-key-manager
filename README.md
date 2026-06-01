# Truck Key Management System

Fleet truck key checkout and return tracking dashboard. Bilingual (English/French).

## Features

- **Check Out / Return Keys** - Scan employee badge + truck key to checkout, scan truck to return
- **Active Keys** - Live view of all currently checked-out trucks with duration tracking
- **Search** - Find by truck number, employee number, or transaction ID
- **History** - Full transaction log with date/status filters + Excel export
- **Daily Report** - Daily stats with hourly activity chart
- **Weekly Report** - Weekly summary, most-used trucks, average checkout duration
- **Bilingual** - English/French toggle
- **Error Handling** - Can't check out a truck that's already out; clear error messages
- **Employee ID Masking** - Only shows last 8 digits of scanned employee IDs

## Quick Start

### 1. Set up a PostgreSQL database

Get a free database at [Neon](https://neon.tech) (recommended) or run locally.

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

### 3. Install and run

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add `DATABASE_URL` environment variable (your Neon/Supabase PostgreSQL URL)
4. Deploy

Prisma generates automatically on build via the `postinstall` script.

## Tech Stack

- Next.js 16 (App Router)
- Prisma + PostgreSQL
- Tailwind CSS
- Recharts (charts)
- SheetJS (Excel export)
