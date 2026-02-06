# Muraqqa Gallery - Render.com Deployment Guide

## 📋 Prerequisites Checklist

### Environment Variables in Render Dashboard

Ensure these environment variables are set in your Render.com dashboard:

#### Backend Service (muraqqa-backend)
```
NODE_ENV=production
PORT=10000  # Render auto-assigns, but good to have
DATABASE_URL=<your-render-postgresql-url>
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-cloudinary-key>
CLOUDINARY_API_SECRET=<your-cloudinary-secret>
CLIENT_URL=<will-be-frontend-url>
```

#### Frontend Service (muraqqa-frontend)
```
VITE_API_URL=<will-be-backend-url>/api
```

**Note**: The `CLIENT_URL` and `VITE_API_URL` can use `fromService` property in render.yaml to auto-link services.

---

## 🚀 Deployment Strategy

### Option A: Using `prisma db push` (Recommended)
Since your migrations have drifted, use `prisma db push` to sync the schema directly.

### Option B: Reset and Use Migrations
If you want proper migration history, you'd need to:
1. Generate new migrations from current schema
2. Reset the migration history
3. Deploy with `prisma migrate deploy`

**We'll proceed with Option A (db push) as it matches your current workflow.**

---

## 📝 Updated render.yaml

```yaml
services:
  # BACKEND SERVICE
  - type: web
    name: muraqqa-backend
    runtime: node
    root: server
    # Specify Node.js version
    buildCommand: |
      npm install
      npx prisma generate
      npx prisma db push --accept-data-loss
      npm run build
    startCommand: npm start
    # Auto-scale settings (optional)
    scaling:
      minInstances: 1
      maxInstances: 3
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false  # Set in Render dashboard
      - key: JWT_SECRET
        generateValue: true  # Render auto-generates secure value
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: CLOUDINARY_CLOUD_NAME
        sync: false  # Set in Render dashboard
      - key: CLOUDINARY_API_KEY
        sync: false  # Set in Render dashboard
      - key: CLOUDINARY_API_SECRET
        sync: false  # Set in Render dashboard
      - key: CLIENT_URL
        fromService:
          type: site
          name: muraqqa-frontend
          property: url

  # FRONTEND SERVICE
  - type: site
    name: muraqqa-frontend
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    # Enable client-side routing
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        fromService:
          type: web
          name: muraqqa-backend
          property: url
        transform: |
          value + "/api"

# Optional: PostgreSQL Database (if not using existing database)
databases:
  - name: muraqqa-db
    databaseName: muraqqa
    user: muraqqa_user
```

---

## 🌱 Database Seeding Strategy

### Post-Deployment Manual Seeding

After first deployment, run seeds via Render Shell:

1. **Navigate to Backend Service** in Render dashboard
2. Click **"Shell"** tab
3. Run seeding commands:

```bash
# Main seed (admin, artists, artworks)
npm run seed

# Landing page content seed
npm run seed:landing
```

### Alternative: Automated Seeding Script

Create a one-time job or post-deploy hook:

**File: `server/post-deploy.sh`**
```bash
#!/usr/bin/env bash
set -e

echo "🌱 Running post-deployment tasks..."

# Check if database is already seeded
if npx prisma db seed --preview-feature 2>&1 | grep -q "already seeded"; then
  echo "✅ Database already seeded, skipping..."
else
  echo "🌱 Seeding database..."
  npm run seed || echo "⚠️ Main seed failed or already exists"
  npm run seed:landing || echo "⚠️ Landing page seed failed or already exists"
fi

echo "✅ Post-deployment tasks complete!"
```

Make it executable:
```bash
chmod +x server/post-deploy.sh
```

Add to render.yaml build command:
```yaml
buildCommand: |
  npm install
  npx prisma generate
  npx prisma db push --accept-data-loss
  npm run build
  ./post-deploy.sh
```

---

## 🔧 Required Code Updates

### 1. Update server.js (Remove Duplicate Migration Logic)

Since migrations run in build command, simplify **server.js**:

```javascript
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Server...');

try {
    // Just start the server - migrations already ran in build
    console.log('⚡ Starting Backend Server...');
    const server = spawn('node', ['dist/server.js'], {
        cwd: path.join(__dirname, 'server'),
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
    });

    server.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
        process.exit(code);
    });

} catch (error) {
    console.error('❌ Server Start Failed:', error);
    process.exit(1);
}
```

### 2. Add .node-version File

Create **`.node-version`** in project root:
```
20
```

This ensures Render uses Node.js v20.

---

## 📊 Deployment Checklist

- [ ] **PostgreSQL Database**: Create PostgreSQL database in Render (or use external)
- [ ] **Backend Service**: Create Web Service with updated render.yaml config
- [ ] **Frontend Service**: Create Static Site with render.yaml config
- [ ] **Environment Variables**: Set all required env vars in Render dashboard
- [ ] **Node Version**: Add `.node-version` file with `20`
- [ ] **Build & Deploy**: Trigger initial deployment
- [ ] **Seed Database**: Run seed commands via Render Shell after first deploy
- [ ] **Test Application**: Verify authentication, artwork loading, Cloudinary uploads
- [ ] **Monitor Logs**: Check both services for any runtime errors

---

## 🔍 Post-Deployment Testing

1. **Backend Health Check**:
   ```
   curl https://muraqqa-backend.onrender.com/api/health
   ```

2. **Frontend Load**:
   Visit `https://muraqqa-frontend.onrender.com`

3. **Test Login**:
   - Admin: `admin@muraqqa.com` / `admin123`
   - Artist: `sadequain@muraqqa.com` / `artist123`
   - User: `user@example.com` / `user123`

4. **Test Artwork Upload** (Admin/Artist dashboard)

5. **Test Cloudinary Integration**

---

## ⚡ Performance Optimizations

### 1. Enable Caching
Add to frontend build command:
```bash
npm run build -- --mode production
```

### 2. Database Connection Pooling
Add to `DATABASE_URL`:
```
?connection_limit=5&pool_timeout=10
```

### 3. Enable Compression
Already included in backend (`compression` middleware)

### 4. CDN for Static Assets
Render automatically provides CDN for static sites

---

## 🐛 Troubleshooting

### Issue: "Prisma Client not found"
**Solution**: Ensure `npx prisma generate` runs in build command

### Issue: "Cannot connect to database"
**Solution**: Verify `DATABASE_URL` is correctly set and accessible

### Issue: "CORS errors"
**Solution**: Ensure `CLIENT_URL` matches frontend URL exactly

### Issue: "Seed already exists" errors
**Solution**: Seeds use `upsert` - this is safe to ignore

### Issue: "Build timeout"
**Solution**: Increase build time limit in Render settings or optimize dependencies

---

## 📚 Additional Resources

- [Render Docs - Node.js](https://render.com/docs/deploy-node-express-app)
- [Render Docs - Static Sites](https://render.com/docs/deploy-create-react-app)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-render)

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong and auto-generated
- [ ] Cloudinary credentials are in environment variables (not code)
- [ ] Database URL is not committed to git
- [ ] CORS is properly configured with actual frontend URL
- [ ] Rate limiting is enabled (already in backend code)
- [ ] Helmet security headers are active (already in backend code)

---

## 📞 Support

If you encounter issues during deployment, check:
1. Render build logs
2. Render runtime logs
3. Database connection status
4. Environment variable configuration
