# Sira Software Pro

Advanced Network Management & Hotspot Billing Platform for MikroTik routers, hotspot vouchers, fingerprint devices, and DVR cameras.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite 7, Tailwind CSS, shadcn/ui, React Router DOM v7
- **Backend**: Node.js (Express) serving REST API on port 3000
- **Database**: Flat-file JSON database at `backend/db.json`
- **Package Manager**: npm

## Project Structure

```
sira-software-pro/
├── backend/           # Express.js backend API
│   ├── server.js      # Main server (port 3000)
│   ├── mikrotik-api.js
│   ├── dvr-api.js
│   ├── fingerprint-api.js
│   └── db.json        # Flat-file database
├── src/               # React frontend (Vite, port 5000)
│   ├── components/    # Reusable UI components (shadcn/ui)
│   ├── contexts/      # Global state (AuthContext)
│   ├── pages/         # Route-based views
│   ├── services/      # API clients (remote + local fallback)
│   └── types/         # TypeScript interfaces
├── public/            # Static assets
└── dist/              # Vite build output (served by Express in prod)
```

## Running the App

- **Dev**: `npm run full:dev` — starts both backend (port 3000) and frontend (port 5000) concurrently
- **Build**: `npm run build` — compiles TypeScript and bundles frontend to `dist/`
- **Production**: `node backend/server.js` — serves built frontend + API on port 3000

## Default Credentials

Controlled via environment variables (set in Replit Secrets):
- `ADMIN_EMAIL` — defaults to `admin@sira.software`
- `ADMIN_PASSWORD` — defaults to `admin123`
- `JWT_SECRET` — secure random key (set as env var)

## Deployment

- Build: `npm run build`
- Run: `node backend/server.js`
- The backend serves the built `dist/` folder as static files in production

## Key Features

- MikroTik router management via RouterOS API
- Hotspot voucher generation, tracking, and CSV export
- Captive portal designer (Hotspot Pages)
- DVR camera management with live stream preview
- Fingerprint device management with connection testing
- JWT-based authentication with bcrypt password hashing
- Auto-refreshing Dashboard (every 30 seconds) with animated counters
- Settings page (profile, password change, system preferences)
- Shared Layout component used by all pages (RTL Arabic UI)
- Backend security: Helmet headers + rate limiting on auth endpoints
- Local storage API fallback for offline operation

## Backend API Routes

- `POST /api/auth/login` — rate-limited
- `POST /api/auth/register` — rate-limited
- `PUT /api/auth/profile` — update profile fields
- `PUT /api/auth/change-password` — verify + hash new password
- `GET /api/settings` — get per-user settings
- `PUT /api/settings` — update per-user settings
- `POST /api/fingerprint/:id/test-connection` — test device connectivity
- Full CRUD: `/api/routers`, `/api/vouchers`, `/api/fingerprint`, `/api/dvr`, `/api/hotspot-pages`, `/api/backgrounds`, `/api/print-cards`
