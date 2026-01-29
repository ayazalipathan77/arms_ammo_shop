import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialLandingPageContent = {
  hero: {
    enabled: true,
    title: 'Elevation of Perspective',
    subtitle: 'Contemporary Pakistani Art',
    accentWord: 'Perspective',
    backgroundImage: '/header_bg.jpg'
  },
  featuredExhibition: {
    enabled: true,
    exhibitionId: null,
    manualOverride: {
      title: 'Shadows of the Past',
      artistName: 'Zara Khan',
      description: 'Explore the ethereal boundaries between memory and reality in this groundbreaking collection. Khan\'s work challenges the conventional narrative of spatial dynamics in miniature painting.',
      date: 'OCT 12 — DEC 24',
      imageUrl: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2070&auto=format&fit=crop'
    }
  },
  curatedCollections: {
    enabled: true,
    collections: [
      {
        id: 'col1',
        title: 'Abstract Modernism',
        artworkIds: [],
        layout: 'large',
        imageUrl: 'https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=800&auto=format&fit=crop'
      },
      {
        id: 'col2',
        title: 'Calligraphic Heritage',
        artworkIds: [],
        layout: 'tall',
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop'
      }
    ]
  },
  topPaintings: {
    enabled: false,
    artworkIds: []
  },
  muraqQaJournal: {
    enabled: true,
    featuredConversationIds: []
  }
};

async function seedLandingPage() {
  try {
    console.log('Seeding landing page content...');

    // Upsert the landing page content setting
    await prisma.setting.upsert({
      where: { key: 'landingPageContent' },
      update: { value: initialLandingPageContent },
      create: {
        key: 'landingPageContent',
        value: initialLandingPageContent
      }
    });

    console.log('✅ Landing page content seeded successfully!');
    console.log('\nInitial landing page structure:');
    console.log('- Hero section: Enabled');
    console.log('- Featured Exhibition: Manual override mode');
    console.log('- Curated Collections: 2 collections (needs artwork assignment)');
    console.log('- Top Paintings: Disabled (enable and add artworks via admin)');
    console.log('- Muraqqa Journal: Enabled (needs conversation assignment)');
    console.log('\n👉 Next steps:');
    console.log('1. Start the server: cd server && npm run dev');
    console.log('2. Login as admin');
    console.log('3. Go to Admin Dashboard → LANDING PAGE tab');
    console.log('4. Assign artworks to collections');
    console.log('5. Select featured conversations');
    console.log('6. Optionally enable and configure Top Paintings section');

  } catch (error) {
    console.error('❌ Error seeding landing page content:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedLandingPage();
