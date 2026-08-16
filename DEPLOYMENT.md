# MCO Deployment Guide

This release targets a split production deployment:

- Backend: Railway Express service from `backend/`
- Database: Supabase PostgreSQL (already provisioned and migrated)
- Frontend: Vercel React/Vite site from `frontend/`

## Railway Backend

Set the Railway service root directory to:

```text
backend
```

Use these Railway environment variables for the backend service:

```text
DATABASE_URL=postgresql://postgres.<ref>:<NEW-PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
JWT_SECRET=<generate-a-long-random-secret>
CORS_ORIGIN=https://<your-project>.vercel.app
NODE_ENV=production
```

Do not set `PORT` — Railway injects it, and `server.js` reads it.

`CORS_ORIGIN` is a comma-separated list. Include every origin the browser will
actually send, e.g. both the apex Vercel domain and any preview domain you plan
to demo from. An origin that is not listed gets a 403.

Railway start command:

```text
npm start
```

Health check path:

```text
/health
```

Migrations are already applied to the Supabase database (all nine tables plus
the `system_stats` view). They are idempotent, so re-running is safe and is
only needed if you point at a fresh database:

```text
npm run migrate
```

Then confirm:

```text
<your-railway-backend-url>/health
```

Expected response:

```json
{ "status": "ok", "service": "backend" }
```

## Vercel Frontend

Recommended Vercel root directory:

```text
frontend
```

Vercel build settings:

```text
Install Command: npm ci
Build Command: npm run build
Output Directory: dist
```

Vercel environment variable:

```text
VITE_API_BASE_URL=<your-railway-backend-url>/api
```

The frontend includes a `vercel.json` rewrite so React Router routes refresh correctly.

## Secrets

`backend/.env` was previously committed to this repository. It is now untracked
(the local file is still there for development), but the old values remain in
git history, so treat them as public:

1. Rotate the Supabase database password and update `DATABASE_URL`.
2. Generate a new `JWT_SECRET` — rotating it invalidates all existing tokens,
   so every user has to log in again:

   ```text
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

3. Set both in the Railway dashboard, never in a committed file.

Only `.env.example` files are tracked. The backend refuses to start if
`DATABASE_URL` or `JWT_SECRET` is missing, rather than falling back to a
default secret.

## Pre-Deploy Verification

Run these before deploying:

```text
npm test
npm run build
```

The MCO test includes the Chapter 3 non-functional requirement that 500 tasks should be scheduled under 2 seconds.
