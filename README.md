# strzSlipz — Personal Bet Tracker

A single-user betting tracker built with Next.js. Log singles, accumulators, bet builders and each-ways, track results, and see your calendar/stats view — with a simple PIN-gated admin area for adding and editing bets.

This repo is set up so you can fork/clone it and have your own instance running in a few minutes, with your own branding, your own admin PIN, and your own data store.

## Features

- Add/edit/delete bets (singles, doubles, trebles, accas, bet builders, each-way, systems) from a PIN-protected `/admin` page, with bookmaker and free-text tags on every bet
- Tracker page with date-range filters, full-text search, sport/result/bookmaker/tag/odds filters, and a "Share" button that copies a link reproducing the exact filtered view
- **Insights** page: month-by-month calendar, breakdowns by sport/bet type/bookmaker/market/odds range, and pattern analysis (win/loss streaks, drawdown, staking-pattern warnings, day-of-week and time-of-day performance)
- **Bankroll** page: track deposits, withdrawals, and adjustments alongside settled-bet profit/loss as a running balance chart
- Shareable bet-slip images — export any bet card as a PNG
- Bet **templates** — save a common bet shape and reuse it to prefill new entries
- Basic **tax report** (year-by-year stake/returns/P&L) and CSV/JSON import & export, all in the admin panel
- A comprehensive **Knowledge Base** page explaining every term and feature
- Installable as a PWA with basic offline viewing of previously-loaded pages
- Data stored in [Upstash Redis](https://upstash.com) (free tier works fine), with a local-JSON fallback for zero-config local development
- Configurable site name, description, currency, unit size, and admin PIN via environment variables — no code changes needed
- Optional AI features (one shared API key, see below): screenshot import, natural-language bet entry, reviewable settlement suggestions, and AI performance summaries

## Getting started

### 1. Clone and install

```bash
git clone <your-fork-url>
cd strz-slipz
npm install
```

### 2. Configure your environment

Copy the example env file and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | No* | REST URL for your Upstash Redis database |
| `UPSTASH_REDIS_REST_TOKEN` | No* | REST token for your Upstash Redis database |
| `NEXT_PUBLIC_SITE_NAME` | No | Shown in the header, footer, and browser tab. Defaults to `strzSlipz` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | No | Page meta description. Defaults to `Personal betting tracker` |
| `NEXT_PUBLIC_CURRENCY` | No | ISO currency code (`GBP`, `USD`, `EUR`, ...) used in the admin area (stake/returns entry). Defaults to `GBP` |
| `NEXT_PUBLIC_UNIT_SIZE` | No | Stake/returns currency per 1 "unit" in the public tracker view. Defaults to `100` |
| `ADMIN_PIN` | Recommended | PIN to unlock `/admin`, checked server-side only. Defaults to `000000` if unset — change this |
| `ANTHROPIC_API_KEY` | No | Enables all AI features (see below). Leave unset to disable them — everything else still works |

\* If the Redis variables are left unset, the app automatically falls back to storing bets in a local `data/bets.json` file. This is great for trying the app out locally, but **won't work on serverless hosts like Vercel** (their filesystem is read-only/ephemeral in production), so set up Redis before deploying.

#### Setting up Upstash Redis (free)

1. Create a free account at [upstash.com](https://upstash.com) and create a new Redis database.
2. From the database dashboard, copy the **REST URL** and **REST Token**.
3. Paste them into `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`.

No schema or migration step is needed — bets are stored as a single JSON blob.

### 3. Run it

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the tracker and [http://localhost:3000/admin](http://localhost:3000/admin) to add bets (enter the PIN you set in `ADMIN_PIN`).

You can sanity-check your storage connection at [http://localhost:3000/api/status](http://localhost:3000/api/status) — it reports which storage backend is active and how many bets are stored.

For a full walkthrough of every feature (bet types, odds formats, units, insights, sharing, imports, and more), see the in-app **Knowledge Base** at `/knowledge-base` once it's running.

### AI features (optional)

All of these are powered by a single `ANTHROPIC_API_KEY` — get one at [console.anthropic.com](https://console.anthropic.com). Leave it unset and every one of these gracefully shows an error while the rest of the app works normally.

- **Screenshot import** — on the "Add Bet" tab, drag a betslip screenshot onto the drop zone (or click it to choose a file). It fills in each leg's selection, market, matchup, odds, sport, and settled result, plus the date and stake — then opens the normal preview so you can check it before adding.
- **Describe it** — the text-entry alternative to a screenshot: type a plain-English sentence describing the bet and it's parsed the same way.
- **Suggest Result** — on a pending bet in the Manage tab, this searches the web for each leg's real-world outcome and proposes a result per leg with a confidence level. It's always a suggestion you review and confirm — nothing settles automatically.
- **AI performance summary** — from the admin Reports tab, generate a short factual summary of performance over a chosen period, shown at the top of the public Insights page.

## Making it your own

- **Site name/description**: set `NEXT_PUBLIC_SITE_NAME` and `NEXT_PUBLIC_SITE_DESCRIPTION` in `.env.local`.
- **Admin PIN**: set `ADMIN_PIN` to a PIN of your choice (any length, numeric keypad — tap ✓ to submit).
- **Colors/theme**: the color palette lives in [src/app/globals.css](src/app/globals.css) under the `@theme` block — edit the `--color-*` variables to change the accent color and dark theme.
- **Currency**: set `NEXT_PUBLIC_CURRENCY` to an ISO code like `GBP`, `USD`, or `EUR` — used only in the admin area for stake/returns entry. The public tracker view never displays real currency, only anonymised "units".
- **Unit size**: set `NEXT_PUBLIC_UNIT_SIZE` to control how much currency equals 1 unit in the public view (see [src/lib/units.ts](src/lib/units.ts)) — e.g. set it to 1% of your typical bankroll so unit sizing scales to you.

> **Note on the admin PIN**: `ADMIN_PIN` is checked server-side only (`src/app/api/admin/login`) and is never sent to the browser or bundled into client JS — unlike the other `NEXT_PUBLIC_*` settings above. On successful login the server sets an HttpOnly session cookie; the PIN itself is never stored client-side. It's still just a single shared PIN rather than a full multi-user auth system, so treat it as "keeps casual visitors out," not bank-grade security.

## Deploying (Vercel)

1. Push your fork to GitHub and [import it into Vercel](https://vercel.com/new).
2. In the Vercel project's **Environment Variables** settings, add the same variables from `.env.local` (at minimum `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — the app won't persist data across deploys without them).
3. Deploy. `NEXT_PUBLIC_*` variables are baked in at build time, so re-deploy after changing them.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) for styling
- [Upstash Redis](https://upstash.com) for storage, with a local-JSON fallback for development

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # run a production build
npm run lint    # lint the codebase
```
