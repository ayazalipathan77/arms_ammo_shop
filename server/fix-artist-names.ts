import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixArtistNames() {
    console.log('🔧 Fixing artist names in artworks...\n');

    // Get all artworks that don't have artistName or have 'Unknown'
    const artworksToFix = await prisma.artwork.findMany({
        where: {
            OR: [
                { artistName: null },
                { artistName: '' },
                { artistName: 'Unknown' },
            ],
        },
        include: {
            artist: {
                include: {
                    user: {
                        select: {
                            fullName: true,
                        },
                    },
                },
            },
        },
    });

    console.log(`Found ${artworksToFix.length} artworks to fix\n`);

    let fixedCount = 0;
    let failedCount = 0;

    for (const artwork of artworksToFix) {
        try {
            let newArtistName = 'Unknown Artist';

            if (artwork.artist && artwork.artist.user && artwork.artist.user.fullName) {
                newArtistName = artwork.artist.user.fullName;
            }

            await prisma.artwork.update({
                where: { id: artwork.id },
                data: { artistName: newArtistName },
            });

            console.log(`✅ Fixed: "${artwork.title}" → Artist: ${newArtistName}`);
            fixedCount++;
        } catch (error) {
            console.error(`❌ Failed to fix artwork ${artwork.id}:`, error);
            failedCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📝 Total: ${artworksToFix.length}`);
}

fixArtistNames()
    .catch((e) => {
        console.error('Error fixing artist names:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
