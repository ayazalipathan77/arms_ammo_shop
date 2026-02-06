# 🔧 TypeScript Build Error - Comprehensive Fix

## Problem
TypeScript compilation fails on Render with "Could not find declaration file for module" errors despite having all `@types/*` packages in `devDependencies`.

## Root Cause
Render sets `NODE_ENV=production` as a service-level environment variable, which causes npm to skip `devDependencies` during installation, even with flags like `--include=dev`.

---

## ✅ Solution #1: Override NODE_ENV During Install (RECOMMENDED)

Update render.yaml build command:

```yaml
buildCommand: |
  NODE_ENV=development npm install
  npx prisma generate
  npx prisma db push --accept-data-loss
  npm run build
```

**Why this works:**
- Temporarily sets NODE_ENV to development ONLY for the install command
- npm installs ALL dependencies including devDependencies
- Subsequent commands still see NODE_ENV=production from service config
- Build runs with production optimizations

---

## 🔄 Solution #2: Use --production=false Flag

If Solution #1 doesn't work, try:

```yaml
buildCommand: |
  npm install --production=false
  npx prisma generate
  npx prisma db push --accept-data-loss
  npm run build
```

**Why this works:**
- Explicitly tells npm to NOT skip devDependencies
- More explicit than --include=dev

---

## 🔄 Solution #3: Use npm ci

If you have a package-lock.json:

```yaml
buildCommand: |
  NODE_ENV=development npm ci
  npx prisma generate
  npx prisma db push --accept-data-loss
  npm run build
```

**Why this works:**
- `npm ci` is designed for CI/CD environments
- With NODE_ENV=development, it installs all dependencies
- Faster and more reliable than `npm install`

---

## 🔄 Solution #4: Remove NODE_ENV from Build, Set at Runtime

Remove NODE_ENV from render.yaml envVars and set it only at runtime:

```yaml
services:
  - type: web
    name: muraqqa-backend
    buildCommand: |
      npm install
      npx prisma generate
      npx prisma db push --accept-data-loss
      npm run build
    startCommand: NODE_ENV=production npm start
    envVars:
      # Remove NODE_ENV from here
      - key: DATABASE_URL
        sync: false
      # ... other vars
```

**Why this works:**
- NODE_ENV is not set during build phase
- npm installs all dependencies
- NODE_ENV=production is set only when starting the server

---

## 🔄 Solution #5: Move Types to dependencies (NOT RECOMMENDED)

As a last resort, move all `@types/*` packages from devDependencies to dependencies:

```json
{
  "dependencies": {
    "@types/express": "^5.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/passport": "^1.0.17",
    "@types/multer": "^2.0.0",
    "@types/nodemailer": "^7.0.9",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.10.0",
    "typescript": "^5.7.3"
  }
}
```

**Why this is NOT recommended:**
- Increases production bundle size
- Violates separation of build vs runtime dependencies
- Against npm best practices

---

## 🧪 Test Locally

Before deploying, test that the build works locally with production environment:

```bash
cd server

# Test with NODE_ENV=production
NODE_ENV=production npm install
npm run build

# Should fail without devDependencies
# Then test with fix:
NODE_ENV=development npm install
npm run build

# Should succeed
```

---

## 📊 Verify Build Logs on Render

After applying the fix, check Render build logs for:

```
✅ NODE_ENV=development npm install
    added XXX packages in XXs
    ├── @types/express@5.0.0
    ├── @types/bcryptjs@2.4.6
    ├── typescript@5.7.3
    └── ...

✅ npx prisma generate
    ✔ Generated Prisma Client

✅ npx prisma db push
    ✔ Database synced

✅ npm run build
    ✔ Successfully compiled TypeScript
```

---

## 🎯 Current Status

**Applied Solution:** Solution #1 (NODE_ENV=development npm install)

**render.yaml updated:** ✅

**Next step:**
```bash
git add render.yaml
git commit -m "fix: override NODE_ENV during npm install for TypeScript build"
git push origin ver4
```

---

## 🐛 If Still Failing

If the build STILL fails after trying Solution #1:

1. **Check build logs** for the exact npm install output
2. **Verify** that @types packages are actually being installed
3. **Try Solution #2** (--production=false)
4. **Try Solution #4** (remove NODE_ENV from envVars entirely)
5. **Check for .npmrc file** in server/ that might override settings

### Debug Commands in Render Shell

After build (if it partially succeeds):

```bash
# Check if types are installed
ls -la node_modules/@types/

# Check NODE_ENV
echo $NODE_ENV

# Check package.json
cat package.json

# Try manual install
NODE_ENV=development npm install
npm run build
```

---

## 📚 Related Documentation

- [npm environment variables](https://docs.npmjs.com/cli/v9/using-npm/config#environment-variables)
- [Render build environment](https://render.com/docs/deploys#build-environment)
- [TypeScript with Node.js on Render](https://render.com/docs/deploy-typescript)

---

## ✅ Expected Outcome

After applying Solution #1:
- ✅ npm installs all packages including @types/*
- ✅ TypeScript compilation succeeds
- ✅ Build completes successfully
- ✅ Server starts in production mode
- ✅ All API endpoints work correctly

---

**Last Updated:** 2026-02-06
**Status:** Solution #1 applied, awaiting deployment test
