# Landing Page Content Management System

## Overview

The Muraqqa art gallery application now features a comprehensive Content Management System (CMS) for the landing page. Administrators can manage all landing page sections directly from the Admin Dashboard without touching any code.

## Features

### Manageable Sections

1. **Hero Section**
   - Custom title, subtitle, and accent word
   - Background image upload via Cloudinary
   - Enable/disable toggle

2. **Featured Exhibition**
   - Auto mode: Select from existing exhibitions
   - Manual mode: Custom exhibition details
   - Image upload support
   - Enable/disable toggle

3. **Curated Collections**
   - Create up to 3 collections
   - Select artworks for each collection
   - Choose layout (large, tall, normal)
   - Custom titles and images
   - Enable/disable toggle

4. **Top 5 Paintings**
   - Select up to 5 featured artworks
   - Displayed in a grid layout
   - Enable/disable toggle

5. **Muraqqa Journal**
   - Select up to 3 featured conversations
   - Automatically pulls from existing conversations
   - Enable/disable toggle

## Setup Instructions

### 1. Seed Initial Data

Run the landing page seed script to initialize the default landing page content:

```bash
cd server
npm run seed:landing
```

This will create the initial landing page configuration in the database with sensible defaults.

### 2. Start the Application

```bash
# Start backend
cd server
npm run dev

# Start frontend (in another terminal)
cd ..
npm run dev
```

### 3. Access Admin Dashboard

1. Navigate to `/auth` and login with admin credentials
2. Click on your profile icon and go to "Admin Dashboard"
3. Click the "LANDING PAGE" tab

## Using the Landing Page CMS

### Section Visibility

At the top of the Landing Page tab, you'll find toggle switches for each section. Use these to show/hide sections on the home page.

### Hero Section

1. Edit the title, subtitle, and accent word (the word that appears in italic amber)
2. Click on the image area to upload a new background image
3. Images are automatically uploaded to Cloudinary (max 5MB)

### Featured Exhibition

**Auto Mode:**
- Select an exhibition from the dropdown
- Only exhibitions with status "CURRENT" appear
- Exhibition details are automatically pulled from the database

**Manual Mode:**
- Enter custom exhibition details
- Upload a custom image
- Full control over all fields

### Curated Collections

1. Click "Add Collection" to create a new collection (max 3)
2. Enter a collection title
3. Choose a layout:
   - **Large**: Spans 2 columns on desktop
   - **Tall**: Vertical 3:4 aspect ratio
   - **Normal**: Standard aspect ratio
4. Add artworks to the collection using the dropdown
5. Remove artworks by clicking the X button
6. Delete entire collections with the trash icon

### Top Paintings

1. Enable the section using the toggle at the top
2. Use the dropdown to add artworks (max 5)
3. Remove artworks with the trash icon
4. Artworks display with image, title, artist name, and price

### Muraqqa Journal

1. Select up to 3 conversations using the dropdown
2. Conversations display with their category badge (WATCH/LISTEN/LEARN)
3. Remove conversations with the trash icon

### Saving Changes

- Click "Save All Changes" button at the top or bottom of the page
- All changes are saved to the database immediately
- The home page updates automatically
- No restart required

## Technical Details

### Database Schema

Landing page content is stored in the `Setting` model with key `landingPageContent` as JSON:

```typescript
{
  hero: { enabled, title, subtitle, accentWord, backgroundImage }
  featuredExhibition: { enabled, exhibitionId, manualOverride }
  curatedCollections: { enabled, collections: [...] }
  topPaintings: { enabled, artworkIds: [...] }
  muraqQaJournal: { enabled, featuredConversationIds: [...] }
}
```

### API Endpoints

- `GET /api/settings` - Fetch all settings including landing page content
- `POST /api/settings` - Update landing page content (admin only)

### Image Management

- Images upload to Cloudinary automatically
- 5MB file size limit
- Only image files accepted (jpg, png, gif, webp)
- URLs stored in landing page configuration

### Frontend Integration

The Home page ([pages/Home.tsx](pages/Home.tsx)) dynamically renders based on the landing page content from the admin dashboard. All sections have fallbacks to ensure the page never breaks.

## File Structure

```
/pages/
  - Home.tsx                    # Landing page component (now dynamic)
  - AdminDashboard.tsx          # Admin UI with LANDING PAGE tab

/context/
  - GalleryContext.tsx          # State management with landingPageContent

/types.ts                       # TypeScript interfaces for landing page

/server/
  - seed-landing-page.ts        # Seeding script for initial data
  - /src/controllers/
    - setting.controller.ts     # Settings API handlers
  - /src/routes/
    - setting.routes.ts         # Settings API routes
```

## Best Practices

1. **Always test changes**: Preview how sections look before finalizing
2. **Use high-quality images**: Minimum 1920px width for hero backgrounds
3. **Keep titles concise**: Shorter titles look better in the layouts
4. **Select relevant artworks**: Ensure selected artworks match collection themes
5. **Update regularly**: Rotate featured content to keep the page fresh
6. **Monitor performance**: Avoid adding too many large images

## Troubleshooting

### Landing page shows default content
- Ensure you've run the seed script: `npm run seed:landing`
- Check that landingPageContent exists in the Setting table
- Verify admin saved changes after editing

### Images not uploading
- Check Cloudinary credentials in `.env`
- Ensure file size is under 5MB
- Verify file is an image format

### Sections not appearing
- Check section enable toggles in admin
- Verify artworks/conversations are selected
- Clear browser cache and reload

### Changes not saving
- Check browser console for errors
- Verify admin authentication token is valid
- Ensure backend server is running

## Future Enhancements

Potential features to add:
- Drag-and-drop section reordering
- Preview mode before publishing
- Scheduled content changes
- Analytics integration
- A/B testing support
- Multi-language support

## Support

For issues or questions:
1. Check the browser console for errors
2. Review server logs for API errors
3. Ensure all dependencies are installed
4. Verify database migrations are up to date

---

**Note**: This CMS was designed to give full control over the landing page while maintaining the gallery's aesthetic and design principles. All changes preserve the dark theme (stone-950/900) with amber-600 accents.
