# Render.com Environment Variables Setup

## 🔧 Backend Service Environment Variables

Set these in your **muraqqa-backend** service settings:

### Required Variables

| Variable Name | Value/Source | Description |
|--------------|--------------|-------------|
| `NODE_ENV` | `production` | Set environment mode |
| `DATABASE_URL` | **Set in Dashboard** | PostgreSQL connection string from Render database |
| `JWT_SECRET` | **Auto-generated** | Render will generate this automatically |
| `JWT_EXPIRES_IN` | `7d` | JWT token expiration period |
| `CLOUDINARY_CLOUD_NAME` | **Set in Dashboard** | Your Cloudinary cloud name: `didfxynsu` |
| `CLOUDINARY_API_KEY` | **Set in Dashboard** | Your Cloudinary API key: `898752622996387` |
| `CLOUDINARY_API_SECRET` | **Set in Dashboard** | Your Cloudinary API secret (from .env.local) |
| `CLIENT_URL` | **Auto-linked** | Frontend URL (auto-linked via render.yaml) |

### Database URL Format
```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

Example from Render PostgreSQL:
```
postgresql://muraqqa_user:xxxxxxxxxxxxx@dpg-xxxxx-a.oregon-postgres.render.com/muraqqa_db?sslmode=require
```

---

## 🎨 Frontend Service Environment Variables

Set these in your **muraqqa-frontend** service settings:

| Variable Name | Value/Source | Description |
|--------------|--------------|-------------|
| `VITE_API_URL` | **Auto-linked** | Backend API URL + `/api` (auto-linked via render.yaml) |

The frontend will automatically receive the backend URL like:
```
https://muraqqa-backend.onrender.com/api
```

---

## 📝 How to Set Environment Variables in Render

### Method 1: Render Dashboard (Recommended)
1. Go to your service (Backend or Frontend)
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Enter key and value
5. Click **"Save Changes"**

### Method 2: render.yaml (For Static Values)
Already configured in the `render.yaml` file for auto-linked services.

---

## 🔐 Security Best Practices

✅ **DO:**
- Use Render's "Generate Value" for `JWT_SECRET`
- Mark sensitive variables as "Secret" (hidden in logs)
- Use SSL/TLS for database connections (`?sslmode=require`)
- Rotate secrets periodically

❌ **DON'T:**
- Commit `.env` files to Git
- Share credentials in plain text
- Use weak JWT secrets
- Expose API keys in frontend code

---

## 🧪 Testing Environment Variables

### Backend Test
After deployment, check if env vars are loaded:

```bash
# Via Render Shell
echo $DATABASE_URL
echo $JWT_SECRET
echo $CLOUDINARY_CLOUD_NAME
```

### Frontend Test
Check browser console:
```javascript
// In browser dev tools
console.log(import.meta.env.VITE_API_URL)
```

---

## 🐛 Troubleshooting

### Issue: "DATABASE_URL is not defined"
**Solution**: Ensure you've created a PostgreSQL database in Render and copied the External Database URL

### Issue: "CORS errors"
**Solution**: Verify `CLIENT_URL` matches the frontend URL exactly (with HTTPS)

### Issue: "Cloudinary upload fails"
**Solution**: Double-check all three Cloudinary credentials are correctly set

### Issue: "Cannot find module 'prisma'"
**Solution**: Ensure `npx prisma generate` runs in build command

---

## 📋 Environment Variables Checklist

### Before Deployment
- [ ] Create PostgreSQL database in Render
- [ ] Copy DATABASE_URL from Render dashboard
- [ ] Have Cloudinary credentials ready
- [ ] Generate or prepare JWT_SECRET

### After Creating Backend Service
- [ ] Set DATABASE_URL
- [ ] Set JWT_SECRET (or use auto-generate)
- [ ] Set JWT_EXPIRES_IN
- [ ] Set all three Cloudinary credentials
- [ ] CLIENT_URL will auto-link after frontend is created

### After Creating Frontend Service
- [ ] VITE_API_URL will auto-link from backend
- [ ] Verify the link worked by checking service environment tab

### Testing
- [ ] Test backend health endpoint
- [ ] Test frontend loads correctly
- [ ] Test API calls from frontend to backend
- [ ] Test authentication flow
- [ ] Test Cloudinary image uploads

---

## 📞 Support

If environment variables aren't working:
1. Check service logs for "undefined" errors
2. Verify variable names match exactly (case-sensitive)
3. Restart services after adding variables
4. Check Render's status page for outages
