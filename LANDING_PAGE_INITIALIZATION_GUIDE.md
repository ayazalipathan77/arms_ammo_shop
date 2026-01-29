# Landing Page Initialization Guide ✅

## Issue Resolved

Your landing page content has been successfully initialized in the database!

---

## What Was Done

1. ✅ Created `landingPageContent` record in the Setting table
2. ✅ Initialized with default structure:
   - Hero section (enabled)
   - Featured Exhibition (enabled with default data)
   - Curated Collections (enabled with 2 collections: "Abstract Modernism" & "Calligraphic Heritage")
   - Top Paintings (enabled but empty)
   - Muraqqa Journal (enabled but empty)

---

## What You Need to Do Now

### Step 1: Refresh Your Browser

Close and reopen your browser tabs, or do a hard refresh:
- **Windows/Linux:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R

### Step 2: Go to Admin Dashboard

Navigate to: `http://localhost:3003/admin`

Click on the **"LANDING PAGE"** tab

### Step 3: Add Content to Sections

#### A. Top Paintings Section

1. Look for "Top Paintings" heading
2. Make sure the toggle is **ON** (enabled)
3. Click the dropdown labeled "+ Add Artwork"
4. Select up to 5 artworks from your database
5. They'll appear in a list with [X] remove buttons

**Available artworks in your database:**
- Je Teume
- Echoes of Lahore Fort
- Hunza Valley Autumn
- Surah Rahman
- Modern Miniature
- Karachi Street Life

#### B. Curated Collections Section

You have 2 collections pre-configured:

**Collection 1: Abstract Modernism**
1. Find the "Abstract Modernism" collection card
2. Click the dropdown to add artworks
3. Select 1-3 artworks that fit the abstract theme
4. Suggested: "Modern Miniature", "Je Teume"

**Collection 2: Calligraphic Heritage**
1. Find the "Calligraphic Heritage" collection card
2. Click the dropdown to add artworks
3. Select 1-3 artworks with calligraphy/text
4. Suggested: "Surah Rahman" (this appears to be calligraphy)

#### C. Featured Exhibition (Already Set)

The Featured Exhibition section is already configured with default data:
- Title: "Shadows of the Past"
- Artist: "Zara Khan"
- Image from Unsplash

You can leave this as-is or customize it later.

### Step 4: Save Changes

1. Scroll to top or bottom of the page
2. Click **"Save All Changes"** button
3. Wait for success message
4. Note the instruction to refresh home page

### Step 5: View Your Home Page

1. Open new tab: `http://localhost:3003/`
2. Scroll down to see:
   - ✅ Hero section with "Elevation of Perspective"
   - ✅ Featured Exhibition section
   - ✅ **Curated Collections** with your 2 collections
   - ✅ **Featured Artworks** (Top 5 Paintings you selected)
   - ✅ Muraqqa Journal (if you added conversations)

---

## Why Sections Were Empty Before

The landing page content wasn't initialized in the database. The admin dashboard needs this data to:

1. Know which sections are enabled
2. Store which artworks belong to which section
3. Configure collection titles and layouts

Now that it's initialized:
- ✅ All sections are enabled by default
- ✅ You can add artworks through the admin UI
- ✅ Changes save to database
- ✅ Home page displays your configured content

---

## Troubleshooting

### "I still don't see the sections"

**Solution:** Make sure you:
1. Saved changes in admin dashboard
2. Refreshed the home page (F5 or Cmd+R)
3. Added at least 1 artwork to each section

### "Artworks show no artist name"

Some artworks in your database don't have artist names set. This is normal for now. You can either:

**Option A:** Fix existing artworks
```bash
cd /home/ayaz/AI/artgalMurakka/server
npx ts-node fix-artist-names.ts
```

**Option B:** Use the new "Add Artwork" feature with artist dropdown
- Go to Admin Dashboard → INVENTORY
- Click "Add Artwork"
- Select artist from dropdown (not text input)
- Create new artwork with proper artist info

### "Collections show placeholder images"

The collections have default Unsplash images. To use your own:
1. In admin dashboard → LANDING PAGE
2. Find your collection
3. Click the image upload area
4. Upload a custom image (max 5MB)
5. Save changes

---

## Database Record Details

Your landing page content is stored in the `Setting` table:

**Key:** `landingPageContent`
**Type:** JSONB
**Structure:**
```json
{
  "hero": { "enabled": true, ... },
  "featuredExhibition": { "enabled": true, ... },
  "curatedCollections": {
    "enabled": true,
    "collections": [
      { "id": "col1", "title": "Abstract Modernism", "artworkIds": [] },
      { "id": "col2", "title": "Calligraphic Heritage", "artworkIds": [] }
    ]
  },
  "topPaintings": { "enabled": true, "artworkIds": [] },
  "muraqQaJournal": { "enabled": true, "featuredConversationIds": [] }
}
```

---

## Next Steps

### Immediate (Required):
1. ✅ Add artworks to Top Paintings
2. ✅ Add artworks to both Curated Collections
3. ✅ Save and refresh to see results

### Later (Optional):
- Upload custom hero background image
- Change collection titles
- Add conversations to Muraqqa Journal section
- Create new collections (max 3 total)
- Switch Featured Exhibition to auto-select from database

---

## Quick Reference Commands

### Check Landing Page Content:
```bash
cd /home/ayaz/AI/artgalMurakka/server
PGPASSWORD=ayaz12344321 psql -h 127.0.0.1 -U user -d muraqqa -c "SELECT key, value FROM \"Setting\" WHERE key = 'landingPageContent';"
```

### Re-initialize (if needed):
```bash
cd /home/ayaz/AI/artgalMurakka/server
PGPASSWORD=ayaz12344321 psql -h 127.0.0.1 -U user -d muraqqa -f init-landing.sql
```

### List Available Artworks:
```bash
PGPASSWORD=ayaz12344321 psql -h 127.0.0.1 -U user -d muraqqa -c "SELECT id, title, \"artistName\" FROM \"Artwork\";"
```

---

## Summary

✅ **Database:** Landing page content initialized
✅ **Structure:** All sections created and enabled
⏳ **Your Action:** Add artworks through admin UI
⏳ **Your Action:** Save and refresh home page

**Status:** Ready for configuration! 🎉

Once you add artworks and save, all your sections (Top Paintings, Curated Collections, Calligraphic Heritage) will appear on the home page.

---

**Date:** 2026-01-29
**Solution:** Direct SQL initialization
**File Created:** `/home/ayaz/AI/artgalMurakka/server/init-landing.sql`
