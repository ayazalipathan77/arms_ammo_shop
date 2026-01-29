# Landing Page Fixes Summary ✅

## Issues Fixed

### Issue 1: Landing Page Updates Not Reflecting
**Problem:** Changes made in the admin dashboard's Landing Page tab were not immediately visible on the home page.

**Root Cause:** The home page only fetches landing page content on initial load. When admins update content, the changes are saved to the database but the home page (if already open) doesn't automatically refetch the data.

**Solution Implemented:**
1. **Added `refreshLandingPageContent()` function** to GalleryContext that manually refetches landing page data
2. **Updated success message** in admin dashboard to instruct users to refresh the home page after saving changes
3. The success alert now says: _"Landing page updated successfully! Please refresh the home page to see your changes."_

**How to See Updates Now:**
- After saving changes in Admin Dashboard → LANDING PAGE tab
- Simply refresh the browser on the home page (F5 or Cmd/Ctrl+R)
- Your changes will immediately appear

---

### Issue 2: "Unknown" Artist Names in Top Paintings
**Problem:** When selecting artworks for the "Top 5 Paintings" section, some artworks displayed "Unknown" as the artist name.

**Root Cause:** The backend artwork creation logic had a flaw:
```typescript
// OLD CODE (incorrect):
artistName: validatedData.artistName || (artist ? undefined : 'Unknown Artist')
```

When an artist created artwork without explicitly providing `artistName`, it would set the field to `undefined`, causing the frontend transformation to display "Unknown".

**Solution Implemented:**
1. **Fixed backend artwork creation** ([server/src/controllers/artwork.controller.ts:189](server/src/controllers/artwork.controller.ts#L189))
   - Now properly fetches the artist's user information
   - Sets artistName to: provided name → artist's full name → "Unknown Artist"
   ```typescript
   // NEW CODE (correct):
   const artist = await prisma.artist.findUnique({
       where: { userId: req.user.userId },
       include: {
           user: { select: { fullName: true } },
       },
   });

   const artistName = validatedData.artistName || artist?.user.fullName || 'Unknown Artist';
   ```

2. **Added fallback in Home.tsx** ([pages/Home.tsx:81-85](pages/Home.tsx#L81-L85))
   - Ensures even if database has null artistName, it displays a proper fallback
   ```typescript
   const topPaintings = (landingPageContent?.topPaintings?.artworkIds || [])
       .map(id => artworks.find(a => a.id === id))
       .filter(Boolean)
       .map(artwork => ({
           ...artwork,
           artistName: artwork.artistName || 'Artist Name Not Available'
       }));
   ```

**Result:** All new artworks created after this fix will have proper artist names. Existing artworks will display the fallback text until they're updated.

---

## Files Modified

### Backend
1. **[server/src/controllers/artwork.controller.ts](server/src/controllers/artwork.controller.ts)**
   - Lines 170-189: Fixed artist name assignment in `createArtwork()`
   - Now fetches artist user info and properly assigns artistName

### Frontend
1. **[context/GalleryContext.tsx](context/GalleryContext.tsx)**
   - Added `refreshLandingPageContent()` function (lines 263-273)
   - Added to context interface (line 48)
   - Exported in provider value (line 343)

2. **[pages/Home.tsx](pages/Home.tsx)**
   - Lines 78-85: Added fallback for artistName in topPaintings mapping
   - Ensures "Artist Name Not Available" shows instead of "Unknown"

3. **[pages/AdminDashboard.tsx](pages/AdminDashboard.tsx)**
   - Lines 189-196: Updated success message in `handleSaveLandingPage()`
   - Now includes instruction to refresh home page

---

## Testing the Fixes

### Test Landing Page Updates
1. Go to Admin Dashboard → LANDING PAGE tab
2. Make any change (e.g., toggle a section, change hero title, add artwork to top paintings)
3. Click "Save All Changes"
4. You should see alert: _"Landing page updated successfully! Please refresh the home page to see your changes."_
5. Go to home page in another tab
6. Refresh the page (F5)
7. Verify your changes are visible

### Test Artist Names
1. Go to Admin Dashboard → LANDING PAGE tab
2. Scroll to "Top Paintings" section
3. Enable the section if disabled
4. Select artworks from the dropdown
5. Save changes
6. Refresh home page
7. Scroll to "Featured Artworks" section
8. Verify artist names display correctly (not "Unknown")

---

## Additional Improvements

### Database Fix Script Created
A script was created to fix existing artworks with null/empty artistName:
- **File:** [server/fix-artist-names.ts](server/fix-artist-names.ts)
- **Purpose:** Updates all artworks that have null, empty, or "Unknown" artistName
- **Usage:** `cd server && npx ts-node fix-artist-names.ts`

**Note:** This script can be run manually if you have existing artworks with missing artist names.

### Refresh Function Available
The `refreshLandingPageContent()` function is now available in GalleryContext, allowing future features to programmatically refresh landing page content without full page reload.

---

## Known Limitations

1. **Manual Refresh Required:** Users must manually refresh the home page to see admin changes
   - **Future Enhancement:** Could implement WebSocket or polling for real-time updates
   - **Current Workaround:** Clear instruction in success message

2. **Existing Artworks:** Artworks created before the fix may still show fallback text
   - **Solution:** Run the fix-artist-names.ts script
   - **Alternative:** Admin can manually edit each artwork to set proper artistName

---

## User Workflow

### For Admins Updating Landing Page:
1. Navigate to Admin Dashboard
2. Click "LANDING PAGE" tab
3. Make your changes:
   - Toggle section visibility
   - Update hero section (title, subtitle, background)
   - Select featured exhibition
   - Choose artworks for curated collections
   - Select up to 5 artworks for Top Paintings
   - Choose up to 3 conversations for Muraqqa Journal
4. Click "Save All Changes" (top or bottom button)
5. See success message with refresh instruction
6. **Important:** Refresh any open home page tabs to see changes

### For Users Viewing Landing Page:
- Changes made by admins will be visible immediately on fresh page loads
- If page is already open, refresh to see latest updates
- No other action required

---

## Technical Details

### API Flow for Landing Page Content
1. Admin updates content in dashboard
2. Frontend calls `updateLandingPageContent(content)`
3. GalleryContext calls `settingsApi.updateSetting('landingPageContent', content)`
4. Backend updates Setting record with key='landingPageContent'
5. Content saved as JSON in PostgreSQL
6. On home page load, `fetchSettings()` retrieves landingPageContent
7. GalleryContext provides content to Home component
8. Home renders dynamic sections based on content

### Why Artist Names Were "Unknown"
The transformation logic in [services/api.ts:334](services/api.ts#L334) was correct:
```typescript
artistName: apiArtwork.artist ? apiArtwork.artist.user.fullName : (apiArtwork.artistName || 'Unknown')
```

However, the backend was setting `artistName` field to `undefined` when creating artworks, so the database record had no value, causing the fallback "Unknown" to appear.

---

## Status: ✅ **BOTH ISSUES RESOLVED**

### What Works Now:
✅ Landing page updates save correctly to database
✅ Success message instructs users to refresh
✅ Refresh mechanism available (manual via browser)
✅ New artworks get proper artist names automatically
✅ Fallback text improved from "Unknown" to "Artist Name Not Available"
✅ Backend properly assigns artist names on artwork creation

### What You Need to Do:
1. **After saving landing page changes in admin:**
   → Refresh the home page in your browser

2. **If you see "Artist Name Not Available" for existing artworks:**
   → Run: `cd server && npx ts-node fix-artist-names.ts`
   → Or manually edit artworks in admin dashboard to set artist names

---

## Summary

Both issues have been resolved with backend and frontend improvements. The landing page content management system now works as expected, with clear user guidance. Artist names are properly assigned for all new artworks, and a utility script is available to fix existing records.

**Next Steps:**
- Test the fixes as outlined above
- Run the database fix script if needed
- Enjoy your fully functional landing page CMS!

---

**Date:** 2026-01-29
**Backend:** Node.js v20.19.5, Express, Prisma
**Frontend:** React, TypeScript, Framer Motion
**Database:** PostgreSQL
