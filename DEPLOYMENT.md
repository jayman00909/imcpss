# IMCPSS Deployment Guide

This release targets a split production deployment:

- Backend: Railway Express service from `backend/`
- Database: Railway PostgreSQL
- Frontend: Vercel React/Vite site from `frontend/`

## Railway Backend

Set the Railway service root directory to:

```text
backend
```

Use these Railway environment variables for the backend service:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=true
JWT_SECRET=<generate-a-long-random-secret>
CORS_ORIGIN=<your-vercel-frontend-url>
NODE_ENV=production
```

Railway start command:

```text
npm start
```

Health check path:

```text
/health
```

Run database migrations after PostgreSQL is provisioned:

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
