-- Initialize landing page content
INSERT INTO "Setting" (key, value, "createdAt", "updatedAt")
VALUES (
  'landingPageContent',
  '{
    "hero": {
      "enabled": true,
      "title": "Elevation of Perspective",
      "subtitle": "Contemporary Pakistani Art",
      "accentWord": "Perspective",
      "backgroundImage": "/header_bg.jpg"
    },
    "featuredExhibition": {
      "enabled": true,
      "exhibitionId": null,
      "manualOverride": {
        "title": "Shadows of the Past",
        "artistName": "Zara Khan",
        "description": "Explore the ethereal boundaries between memory and reality in this groundbreaking collection.",
        "date": "OCT 12 — DEC 24",
        "imageUrl": "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2070&auto=format&fit=crop"
      }
    },
    "curatedCollections": {
      "enabled": true,
      "collections": [
        {
          "id": "col1",
          "title": "Abstract Modernism",
          "artworkIds": [],
          "layout": "large",
          "imageUrl": "https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=800&auto=format&fit=crop"
        },
        {
          "id": "col2",
          "title": "Calligraphic Heritage",
          "artworkIds": [],
          "layout": "tall",
          "imageUrl": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop"
        }
      ]
    },
    "topPaintings": {
      "enabled": true,
      "artworkIds": []
    },
    "muraqQaJournal": {
      "enabled": true,
      "featuredConversationIds": []
    }
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (key)
DO UPDATE SET
  value = EXCLUDED.value,
  "updatedAt" = NOW();
