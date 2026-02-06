#!/usr/bin/env bash
# Exit on error
set -e

echo "Build started..."

# 1. Install Dependencies for Backend
echo "Installing backend dependencies..."
cd server
npm install

# 2. Build Backend
echo "Building backend..."
npm run build
cd ..

# 3. Install Dependencies for Frontend
echo "Installing frontend dependencies..."
npm install

# 4. Build Frontend
echo "Building frontend..."
npm run build

echo "Build complete!"
