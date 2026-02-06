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

# Ensure server.cjs exists (renamed from server.js for CommonJS compatibility)
if [ ! -f "server.cjs" ] && [ -f "server.js" ]; then
    mv server.js server.cjs
fi

# Optional: Run database seeds if RUN_SEED environment variable is set to "true"
if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 RUN_SEED is enabled - Running database seeds..."
    cd server

    echo "Running main seed data..."
    npm run seed

    echo "Running landing page seed..."
    npm run seed:landing

    cd ..
    echo "✅ Database seeding completed!"
else
    echo "ℹ️  Skipping seeds (set RUN_SEED=true to enable)"
fi
