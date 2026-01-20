import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@muraqqa.com' },
        update: {},
        create: {
            email: 'admin@muraqqa.com',
            passwordHash: adminPassword,
            fullName: 'Admin User',
            role: 'ADMIN',
            phoneNumber: '+92-300-1234567',
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create Artists with User accounts
    const artistsData = [
        {
            email: 'sadequain@muraqqa.com',
            fullName: 'Sadequain (Tribute)',
            bio: 'Exploring the mystic soul of the walled city.',
            specialty: 'Abstract Calligraphy',
            originCity: 'Lahore',
        },
        {
            email: 'ahmed.khan@muraqqa.com',
            fullName: 'Ahmed Khan',
            bio: 'Master of silver leaf and oil overlays.',
            specialty: 'Islamic Calligraphy',
            originCity: 'Karachi',
        },
        {
            email: 'alia.syed@muraqqa.com',
            fullName: 'Alia Syed',
            bio: 'Reviving ancient techniques for modern narratives.',
            specialty: 'Contemporary Miniature',
            originCity: 'Islamabad',
        },
    ];

    const artists = [];
    for (const artistData of artistsData) {
        const password = await bcrypt.hash('artist123', 10);
        const user = await prisma.user.upsert({
            where: { email: artistData.email },
            update: {},
            create: {
                email: artistData.email,
                passwordHash: password,
                fullName: artistData.fullName,
                role: 'ARTIST',
            },
        });

        const artist = await prisma.artist.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                bio: artistData.bio,
                originCity: artistData.originCity,
            },
        });

        artists.push(artist);
        console.log('✅ Artist created:', artistData.fullName);
    }

    // Create Artworks
    const artworksData = [
        {
            title: 'Echoes of Lahore Fort',
            artistIndex: 0,
            price: 450000,
            imageUrl: 'https://picsum.photos/800/1200?random=1',
            medium: 'Oil on Canvas',
            dimensions: '48x60',
            year: 2023,
            description: 'A vivid abstraction capturing the mystic soul of the walled city.',
            category: 'Abstract',
            provenanceHash: 'BLK-001-2023',
            isAuction: true,
        },
        {
            title: 'Hunza Valley Autumn',
            artistIndex: 0,
            price: 120000,
            imageUrl: 'https://picsum.photos/1200/800?random=2',
            medium: 'Acrylic on Canvas',
            dimensions: '36x24',
            year: 2024,
            description: 'The golden hues of Northern Pakistan captured in flat, vibrant planes.',
            category: 'Landscape',
            provenanceHash: 'BLK-002-2024',
        },
        {
            title: 'Surah Rahman',
            artistIndex: 1,
            price: 850000,
            imageUrl: 'https://picsum.photos/800/800?random=3',
            medium: 'Silver Leaf and Oil',
            dimensions: '40x40',
            year: 2022,
            description: 'Intricate Islamic calligraphy layered over oxidized silver leaf.',
            category: 'Calligraphy',
            provenanceHash: 'BLK-003-2022',
        },
        {
            title: 'Modern Miniature',
            artistIndex: 2,
            price: 950000,
            imageUrl: 'https://picsum.photos/600/900?random=4',
            medium: 'Gouache on Wasli',
            dimensions: '12x18',
            year: 2023,
            description: 'Traditional Mughal techniques applied to contemporary themes.',
            category: 'Miniature',
            provenanceHash: 'BLK-004-2023',
        },
        {
            title: 'Karachi Street Life',
            artistIndex: 1,
            price: 75000,
            imageUrl: 'https://picsum.photos/900/600?random=5',
            medium: 'Mixed Media',
            dimensions: '30x30',
            year: 2024,
            description: 'Raw energy of the metropolis.',
            category: 'Abstract',
            provenanceHash: 'BLK-005-2024',
        },
    ];

    for (const artworkData of artworksData) {
        const artwork = await prisma.artwork.create({
            data: {
                title: artworkData.title,
                artistId: artists[artworkData.artistIndex].id,
                price: artworkData.price,
                imageUrl: artworkData.imageUrl,
                medium: artworkData.medium,
                dimensions: artworkData.dimensions,
                year: artworkData.year,
                description: artworkData.description,
                category: artworkData.category,
                provenanceHash: artworkData.provenanceHash,
                isAuction: artworkData.isAuction || false,
            },
        });
        console.log('✅ Artwork created:', artwork.title);
    }

    // Create a sample user
    const userPassword = await bcrypt.hash('user123', 10);
    const sampleUser = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            passwordHash: userPassword,
            fullName: 'Sample User',
            role: 'USER',
            phoneNumber: '+92-300-9876543',
        },
    });
    console.log('✅ Sample user created:', sampleUser.email);

    console.log('🎉 Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
