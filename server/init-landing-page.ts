import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initLandingPage() {
    console.log('🚀 Initializing Landing Page Content...\n');

    try {
        // Check if landing page content already exists
        const existing = await prisma.setting.findUnique({
            where: { key: 'landingPageContent' }
        });

        if (existing) {
            console.log('✅ Landing page content already exists!');
            console.log('\nCurrent content:', JSON.stringify(existing.value, null, 2));
            return;
        }

        // Create initial landing page content
        const initialContent = {
            hero: {
                enabled: true,
                title: "Elevation of Perspective",
                subtitle: "Contemporary Pakistani Art",
                accentWord: "Perspective",
                backgroundImage: "/header_bg.jpg"
            },
            featuredExhibition: {
                enabled: true,
                exhibitionId: null,
                manualOverride: {
                    title: "Shadows of the Past",
                    artistName: "Zara Khan",
                    description: "Explore the ethereal boundaries between memory and reality in this groundbreaking collection. Khan's work challenges the conventional narrative of spatial dynamics in miniature painting.",
                    date: "OCT 12 — DEC 24",
                    imageUrl: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2070&auto=format&fit=crop"
                }
            },
            curatedCollections: {
                enabled: true,
                collections: [
                    {
                        id: "col1",
                        title: "Abstract Modernism",
                        artworkIds: [],
                        layout: "large",
                        imageUrl: "https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=800&auto=format&fit=crop"
                    },
                    {
                        id: "col2",
                        title: "Calligraphic Heritage",
                        artworkIds: [],
                        layout: "tall",
                        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop"
                    }
                ]
            },
            topPaintings: {
                enabled: true,
                artworkIds: []
            },
            muraqQaJournal: {
                enabled: true,
                featuredConversationIds: []
            }
        };

        // Insert into database
        await prisma.setting.create({
            data: {
                key: 'landingPageContent',
                value: initialContent as any
            }
        });

        console.log('✅ Landing page content initialized successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Go to Admin Dashboard → LANDING PAGE tab');
        console.log('2. Add artworks to "Top Paintings" section');
        console.log('3. Add artworks to "Curated Collections"');
        console.log('4. Save changes');
        console.log('5. Refresh the home page to see your content!');

    } catch (error) {
        console.error('❌ Error initializing landing page:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

initLandingPage();
