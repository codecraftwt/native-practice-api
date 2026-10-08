# Backend - DineFlow (Restaurant POS)

Backend API for multi-tenant restaurant management platform.

## Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Zod Validation
- Socket.IO (planned for V2)

## Setup

1. Install dependencies
```bash
cd backend
npm install
```

2. Create .env file
```bash
cp .env.example .env
```
Update values in .env (MongoDB URI, JWT secrets, etc.)

3. Start development server
```bash
npm run dev
```

4. Health check
```bash
curl http://localhost:5000/health
```

## API
Base URL: `/api/v1`
See `docs/specs/api-spec.md` for full API documentation.

## Deploy to Vercel

The repo is preconfigured for Vercel (`vercel.json` + `api/index.js` serverless entry).
Every route, including `/health` and `/api/v1/*`, is served by one function.

1. Push this repo and import it on [Vercel](https://vercel.com/new) (framework preset: **Other**).

2. Provision a MongoDB database (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas)) and set the environment variables in
   **Vercel → Settings → Environment Variables**:

   | Variable | Required | Notes |
   |---|---|---|
   | `MONGODB_URI` | yes | Atlas connection string (include `/dineflow` db name) |
   | `JWT_ACCESS_SECRET` | yes | long random string |
   | `JWT_REFRESH_SECRET` | yes | different long random string |
   | `JWT_ACCESS_EXPIRES_IN` | no | default `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | no | default `7d` |
   | `API_PREFIX` | no | default `/api/v1` |
   | `CORS_ORIGIN` | no | comma-separated origins, default `*` |
   | `NODE_ENV` | no | use `production` |

3. Seed the database once (runs locally against the Atlas URI):
   ```bash
   MONGODB_URI="mongodb+srv://..." npm run seed
   ```

4. Deploy (CLI or git integration):
   ```bash
   npm i -g vercel
   vercel --prod
   ```

5. Verify: `https://<your-app>.vercel.app/health`

Notes:
- `.env` is gitignored — on Vercel, configuration comes only from the dashboard.
- The local flow (`npm run dev` on port 5000) is unchanged.

## Development Notes
- All tenant-scoped data must include `tenantId` from JWT context (enforced by middleware)
- Follow the project roadmap in `docs/PROJECT_PLAN.md`
- Implement features phase by phase (MVP first)