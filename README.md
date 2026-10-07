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

## Development Notes
- All tenant-scoped data must include `tenantId` from JWT context (enforced by middleware)
- Follow the project roadmap in `docs/PROJECT_PLAN.md`
- Implement features phase by phase (MVP first)