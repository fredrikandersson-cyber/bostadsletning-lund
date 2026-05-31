# Bostadsletning Lund - Setup Guide

## Overview
This is a full-stack web application for apartment hunting in Lund, Sweden. Built with React + Vite (frontend) and Express (backend) with PostgreSQL/SQLite database.

## Prerequisites
- Node.js 18+ and npm
- PostgreSQL (for production) or SQLite (for development)

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration (for local dev, SQLite is pre-configured):
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-key"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### 3. Setup Prisma & Database
Generate Prisma client:
```bash
npm run prisma:generate
```

Create database migrations:
```bash
npm run prisma:migrate
```

### 4. Start Development Servers

**Terminal 1 - Frontend (Vite):**
```bash
npm run dev
# Opens at http://localhost:5173
```

**Terminal 2 - Backend (Express):**
```bash
npm run dev:server
# Server running at http://localhost:3000
```

### 5. Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Project Structure

```
src/
├── components/
│   ├── Auth/          # Login/Register forms
│   ├── Listings/      # Listing cards and details
│   └── Applications/  # Application tracking UI
├── pages/             # Page components (Dashboard, FamilySetup, etc)
├── store/             # Zustand state management
├── types/             # TypeScript types
└── utils/             # Helper functions

prisma/
├── schema.prisma      # Database schema
└── migrations/        # Database migrations

server.ts             # Express backend server
```

## API Endpoints

### Authentication
- `POST /api/routes/auth/register` - Register new user
- `POST /api/routes/auth/login` - Login user
- `GET /api/routes/auth/me` - Get current user (requires auth)

### Listings
- `GET /api/routes/listings` - Get all active listings

### Applications
- `GET /api/routes/applications` - Get user's applications
- `POST /api/routes/applications` - Create new application
- `PATCH /api/routes/applications/:id` - Update application status
- `DELETE /api/routes/applications/:id` - Delete application

### Family
- `POST /api/routes/family` - Create/update family
- `POST /api/routes/family/invite` - Invite family member

## Development Workflow

### Database Management
View and edit data:
```bash
npm run prisma:studio
```

Create new migration after schema changes:
```bash
npm run prisma:migrate -- --name add_new_field
```

### Building for Production
```bash
npm run build
```

Outputs:
- Frontend: `dist/` (static files for Vercel)
- Backend: Ready to run with `node dist/server.js` or deploy to Railway

## Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set environment variable `VITE_API_URL` to your backend URL
3. Deploy automatically on push to main

### Backend (Railway)
1. Create Railway project and PostgreSQL plugin
2. Set environment variables:
   - `DATABASE_URL` (from Railway PostgreSQL)
   - `JWT_SECRET`
   - `SENDGRID_API_KEY` (for emails)
3. Deploy from GitHub

## Testing

### Local API Testing with cURL
```bash
# Register
curl -X POST http://localhost:3000/api/routes/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/routes/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user (use token from login)
curl -X GET http://localhost:3000/api/routes/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Port already in use
Change port in `server.ts` or kill the process:
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Database connection issues
Check `.env.local` DATABASE_URL is correct and database is running/accessible.

For SQLite: Delete `dev.db` and re-run migrations:
```bash
rm dev.db
npm run prisma:migrate
```

### Module not found errors
Regenerate Prisma client:
```bash
npm run prisma:generate
```

## Next Steps (Phase 2)

- [ ] Integrate Hemnet API for real listings
- [ ] Setup email notifications with SendGrid
- [ ] Add map view for listings
- [ ] Implement listing filters and search
- [ ] Test with real data
