# Quick Start: Landing Page CMS

## Initial Setup (3 Methods)

### Method 1: Through Admin UI (Recommended - Easiest)

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

2. **Login as Admin:**
   - Navigate to `http://localhost:5173/auth`
   - Login with admin credentials
   - Go to Admin Dashboard

3. **Initialize Landing Page:**
   - Click the "LANDING PAGE" tab
   - The form will initialize with sensible defaults
   - Simply click "Save All Changes" to persist the initial config
   - That's it! The landing page is now configured.

4. **Customize Content:**
   - Upload hero background image
   - Select artworks for collections
   - Choose featured conversations
   - Enable Top Paintings section and add artworks
   - Save changes

### Method 2: Using SQL (Direct Database)

1. **Run the SQL seed file:**
   ```bash
   # If using PostgreSQL directly
   psql -d your_database_name -f server/seed-landing-page-manual.sql

   # Or copy the content from seed-landing-page-manual.sql and paste it in Prisma Studio
   ```

2. **Start the application:**
   ```bash
   npm run dev
   ```

### Method 3: Using Prisma Studio (Visual)

1. **Open Prisma Studio:**
   ```bash
   cd server
   npx prisma studio
   ```

2. **Add Setting Record:**
   - Click on "Setting" model
   - Click "Add record"
   - Set key: `landingPageContent`
   - Set value: (copy from seed-landing-page-manual.sql JSON)
   - Save

3. **Start the application:**
   ```bash
   npm run dev
   ```

## Verify Setup

1. Navigate to `http://localhost:5173/` (home page)
2. You should see:
   - ✅ Hero section with "Elevation of Perspective" title
   - ✅ Featured Exhibition section
   - ✅ Curated Collections (2 collections)
   - ✅ Muraqqa Journal section

## Next Steps

### 1. Assign Artworks to Collections

- Go to Admin Dashboard → LANDING PAGE
- Scroll to "Curated Collections"
- For each collection, use the dropdown to add artworks
- Save changes
- Refresh home page to see actual artworks

### 2. Select Featured Conversations

- In LANDING PAGE tab, scroll to "Muraqqa Journal"
- Select up to 3 conversations from the dropdown
- Save changes

### 3. Enable Top Paintings

- Toggle "Top Paintings" to enabled at the top
- Scroll to "Top 5 Paintings" section
- Add up to 5 artworks using the dropdown
- Save changes

### 4. Customize Hero Section

- Upload a custom hero background image (click on image area)
- Edit title, subtitle, or accent word
- Save changes

### 5. Configure Featured Exhibition

- Choose between Auto (select existing exhibition) or Manual mode
- Auto: Select from current exhibitions
- Manual: Enter custom exhibition details
- Save changes

## Troubleshooting

### Home page looks broken or shows only defaults
- Check browser console for errors
- Verify landingPageContent exists in database:
  ```bash
  cd server
  npx prisma studio
  # Check Setting model for landingPageContent key
  ```
- Clear browser cache and reload

### Admin UI doesn't show landing page tab
- Ensure you're logged in as ADMIN role
- Check if AdminDashboard.tsx has the LANDING PAGE tab
- Restart the development server

### Can't save changes
- Open browser console and check for errors
- Verify backend server is running on port 5000
- Check admin authentication token is valid

## Features Overview

### What You Can Control

✅ **Hero Section**
- Background image (upload to Cloudinary)
- Main title and subtitle
- Accent word styling

✅ **Featured Exhibition**
- Auto-select from database OR manual entry
- Complete exhibition details
- Custom images

✅ **Curated Collections**
- Up to 3 custom collections
- Select artworks for each
- Choose layout (large/tall/normal)

✅ **Top Paintings**
- Feature up to 5 artworks
- Grid display with prices

✅ **Muraqqa Journal**
- Feature up to 3 conversations
- Automatic category badges

✅ **Section Visibility**
- Enable/disable any section
- Instant updates

### What Happens Automatically

- Images upload to Cloudinary (max 5MB)
- Home page updates immediately after save
- Artwork details pulled from database
- Exhibition data synced from database
- Conversation data synced from database
- All changes persist in PostgreSQL

## Tips

1. **Start Simple:** Just save the defaults first, then customize gradually
2. **Test Often:** Save and refresh home page frequently to see changes
3. **Use Good Images:** Minimum 1920px width for hero backgrounds
4. **Keep It Fresh:** Update featured content regularly
5. **Mobile First:** Preview on mobile devices to ensure responsiveness

## Need Help?

- Check [LANDING_PAGE_CMS_README.md](LANDING_PAGE_CMS_README.md) for detailed documentation
- Review browser console for error messages
- Verify all environment variables are set correctly
- Ensure Cloudinary credentials are configured

---

**Ready to customize your landing page! Start with Method 1 (Admin UI) for the easiest experience.**
