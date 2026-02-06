#!/usr/bin/env bash
# Exit on error
set -e

echo "Build started..."

# 1. Install Dependencies for Backend
echo "Installing backend dependencies..."
cd server
# Force install devDependencies for TypeScript compilation
NODE_ENV=development npm install

# 2. Generate Prisma Client and Sync Database
echo "Generating Prisma Client..."
npx prisma generate

echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# 3. Build Backend
echo "Building backend..."
npm run build
cd ..

# 4. Install Dependencies for Frontend
echo "Installing frontend dependencies..."
# Also need devDependencies for Vite build
NODE_ENV=development npm install

# 5. Build Frontend
echo "Building frontend..."
npm run build

echo "Build complete!"
