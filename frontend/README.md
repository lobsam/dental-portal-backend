# Norbu Dental Clinic — Frontend

React (JS) + Tailwind CSS staff/clinic portal, styled with a Tibetan-inspired
palette (maroon, saffron, turquoise) and subtle motifs (endless knot, cloud
scrolls). Talks to the FastAPI backend in the parent directory.

## Getting started

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` requests to `http://localhost:8000` (see
`vite.config.js`), so run the backend (`poetry run uvicorn app.main:app --reload`)
alongside it.

## What's built

- **Auth**: `/login`, `/register` — registers a clinic + owner account, JWT
  stored in `localStorage`, auto-loads `/auth/me` on refresh.
- **Dashboard shell**: sidebar nav, top bar with signed-in user, protected
  routes (redirect to `/login` if not authenticated).
- **Patients** (`/patients`, `/patients/:id`): search, create, and a detail
  view showing appointments and treatment plans for that patient.
- **Appointments** (`/appointments`): upcoming appointments list, pending
  appointment-request inbox with confirm/decline, and a booking form.
- **Coming soon stubs**: Treatment Plans, Finance, Settings — routed and
  linked in the sidebar, ready to be filled in against the corresponding
  backend endpoints already built (`clinic/patients/treatment-plans`,
  `clinic/finance/*`, `clinic/settings/*`).

## Design notes

- Palette and fonts are defined in `src/index.css` via Tailwind v4's
  `@theme` block — `maroon-*`, `saffron-*`, `turquoise-*`, `parchment-*`.
- `src/components/TibetanMotif.jsx` holds the decorative SVGs (endless
  knot, cloud divider/pattern) used as accents, not as literal reproductions
  of sacred symbols.
- Tibetan script used in the UI (clinic name, sidebar greeting) is a
  secular greeting ("Tashi Delek") and descriptive label, not liturgical
  text.
