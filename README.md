# StockLens Admin — wireframe

Desktop admin UI for VantaTrack StockLens (inventory). Dark-neutral wireframe stage — layout, components and real demo data first; brand colour lands in a later pass.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Drizzle ORM** + **SQLite** (via `@libsql/client`, single local file — no native build)
- **lucide-react** icons
- CSS Modules + design-token CSS variables (see `../DESIGN.md`)
- Playwright (dev only, for screenshots)

## Flow

`login` / `sign-up` → **onboarding** (welcome + choose industry) → **dashboard**. The chosen industry (cookie) reshapes the whole app; the signed-in role gates what you can do.

## Features

**Auth & roles (demo-grade)** — `users` table + 3 seeded accounts; cookie session; role gating in the UI *and* server actions.

| Role | Can |
|---|---|
| **Admin** (Anwar) | everything — create/edit/delete items, approve POs, dispatch/receive transfers, stock moves |
| **Staff** (Rahim) | create/edit items, create POs, dispatch/receive transfers, stock moves — no delete, no approve |
| **Viewer** (Salam) | read-only — nav shows only Dashboard, Items, Reports |

**Screens**
- **Sign-in / Sign-up / Onboarding** — auth + industry chooser (5 PRD item types).
- **Dashboard** — "Needs you today" urgent band, KPI cards + sparklines, 12-month chart, recent activity. Adapts per industry.
- **Items** — adaptive table (columns + statuses reshape per industry), search, category chips, status filter, available-first. Rows link to detail.
- **Item detail** — available / on-hand / reserved, stock-by-location, scan stock in/out, movement history, edit/delete.
- **Add / Edit item** — smart required fields per item type.
- **Transfers** — hub → sub-warehouse stock movement on the company's **own transport** (vehicle + driver), In transit → Received. No supplier, no courier.
- **Purchase Orders** — list, approve (admin), new PO (→ pending approval, no auto-send).
- **Suppliers · Locations · Categories · Reports · Settings**.

**Locations** are a main hub (Dhaka) + sub-warehouses by city (Chittagong, Sylhet, Khulna) + properties (Rio Tower).

## Run

```bash
cd development
npm install
npm run db:seed     # creates stocklens.db and plants the demo company
npm run dev         # http://localhost:3000
```

Demo login: `anwar@anwarsupplies.com` (admin), `rahim@anwarsupplies.com` (staff), `salam@investor.com` (viewer) — password `demo1234`, or use the one-click demo buttons on the login page.

## Notes

- **Desktop only** for this stage (PRD Decision 7). Target ~1280–1920px.
- Status is shown by label + icon + tonal value, never colour alone — colour arrives in the colour pass.
- Auth is demo-grade (plaintext passwords, local only) — not production security.
- Never run `next build` while `next dev` is running — they share `.next` and the dev server will serve unstyled CSS. Fix: stop node, `rm -rf .next`, restart dev.
