# Product Finder - Frontend

React + TypeScript + Vite + Tailwind CSS frontend for the Product Finder.

## Setup

```bash
cp .env.example .env 
npm install
npm run dev
```

See `../HOW_TO_RUN.md` at the project root for running the backend too.

## Structure

```
src/
├── api/                 # All backend HTTP/SSE calls live here
├── components/          # Reusable, focused UI components
├── context/             # Global search/results state (SearchContext)
├── lib/                 # session id, recent-search history, SSE parser
├── pages/               # Home, Results, ProductDetails, Compare
└── types/               # TypeScript types mirroring the backend schemas
```

## Notes

- The search bar talks to `POST /api/search/stream`, a Server-Sent-Events
  endpoint that streams the *real* backend agent's progress (tool calls,
  classification, scoring) as they happen — nothing here is a simulated
  loading animation.
- Product results and detail pages are populated entirely from the last
  search response kept in `SearchContext`; there's no backend endpoint to
  fetch an arbitrary product by id outside of a live search, so navigating
  directly to `/product/:id` without an active search shows a friendly
  empty state instead of a broken page.
- "Recent searches" (the history icon in the header) is a local-only
  convenience stored in `localStorage` — the backend has no search-history
  endpoint, so this is clearly separate from backend data.
