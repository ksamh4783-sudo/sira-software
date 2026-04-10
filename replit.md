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

- Email: `admin@sira.software`
- Password: `admin123`

## Deployment

- Build: `npm run build`
- Run: `node backend/server.js`
- The backend serves the built `dist/` folder as static files in production

## Key Features

- MikroTik router management via RouterOS API
- Hotspot voucher generation and tracking
- Captive portal designer
- DVR camera and fingerprint device management
- JWT-based authentication
- Local storage API fallback for offline operation
