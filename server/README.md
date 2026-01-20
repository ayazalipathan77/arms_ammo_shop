# Muraqqa Server - Backend API

Production-ready backend for the Muraqqa art gallery marketplace.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or use Docker Compose)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/muraqqa?schema=public"
JWT_SECRET="your-super-secret-key-min-32-chars"
```

### 3. Start PostgreSQL (Option A: Docker)

```bash
docker-compose up -d
```

### 3. Start PostgreSQL (Option B: Local Installation)

Install PostgreSQL and create a database:

```sql
CREATE DATABASE muraqqa;
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed the Database

```bash
npm run seed
```

This creates:
- Admin user: `admin@muraqqa.com` / `admin123`
- Sample artists with artworks
- Sample user: `user@example.com` / `user123`

### 6. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   ├── config/
│   │   ├── env.ts         # Environment validation
│   │   └── database.ts    # Prisma client singleton
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   ├── routes/
│   │   └── auth.routes.ts
│   ├── utils/
│   │   └── jwt.ts
│   ├── validators/
│   │   └── auth.validator.ts
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── .env.example
├── package.json
└── tsconfig.json
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with initial data

## Security Features

- ✅ JWT authentication with secure token generation
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Input validation with Zod
- ✅ Role-based access control (RBAC)
- ✅ Environment variable validation

## Next Steps

After Phase 1 is running:
- Phase 2: Artwork and Artist APIs
- Phase 3: Payment and Order Management
- Phase 4: Advanced Features (AI, Analytics)
