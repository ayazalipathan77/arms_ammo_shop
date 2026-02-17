import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed for Arms & Ammo Shop...');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@armsammo.com' },
        update: {},
        create: {
            email: 'admin@armsammo.com',
            passwordHash: adminPassword,
            fullName: 'Admin User',
            role: 'ADMIN',
            phoneNumber: '+92-300-1234567',
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create Manufacturers (was Artists)
    const manufacturersData = [
        {
            email: 'sales@glock.com',
            fullName: 'Glock via distributor', // User name
            name: 'Glock', // Manufacturer name
            description: 'Perfection. The leading global manufacturer of pistols.',
            countryOfOrigin: 'Austria',
            portfolioUrl: 'https://us.glock.com',
        },
        {
            email: 'sales@sigsauer.com',
            fullName: 'Sig Sauer via distributor',
            name: 'Sig Sauer',
            description: 'Born in Europe, perfected in America.',
            countryOfOrigin: 'Germany/USA',
            portfolioUrl: 'https://www.sigsauer.com',
        },
        {
            email: 'sales@beretta.com',
            fullName: 'Beretta via distributor',
            name: 'Beretta',
            description: '500 years of one passion.',
            countryOfOrigin: 'Italy',
            portfolioUrl: 'https://www.beretta.com',
        },
    ];

    const manufacturers = [];
    for (const mData of manufacturersData) {
        const password = await bcrypt.hash('brand123', 10);
        const user = await prisma.user.upsert({
            where: { email: mData.email },
            update: {},
            create: {
                email: mData.email,
                passwordHash: password,
                fullName: mData.fullName,
                role: 'MANUFACTURER',
            },
        });

        const manufacturer = await prisma.manufacturer.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                description: mData.description,
                countryOfOrigin: mData.countryOfOrigin,
                portfolioUrl: mData.portfolioUrl,
            },
        });

        manufacturers.push({ ...manufacturer, name: mData.name }); // Keeping name for reference
        console.log('✅ Manufacturer created:', mData.name);
    }

    // Create Products (Was Artworks)
    const productsData = [
        {
            title: 'Glock 19 Gen5',
            manufacturerIndex: 0,
            price: 185000,
            imageUrl: 'https://us.glock.com/-/media/Global/Cameras/GLOCK-19-Gen5-FS-USA-45-right-104.png',
            category: 'Pistol',
            type: 'FIREARM', // ProductType enum
            caliber: '9x19mm',
            action: 'Safe Action',
            capacity: '15+1',
            barrelLength: '4.02 inch',
            weight: '670g',
            description: 'The GLOCK 19 Gen5 FS pistol in 9mm Luger is ideal for a more versatile role due to its reduced dimensions.',
            year: 2023,
        },
        {
            title: 'Glock 17 Gen5',
            manufacturerIndex: 0,
            price: 195000,
            imageUrl: 'https://us.glock.com/-/media/Global/Cameras/GLOCK-17-Gen5-FS-USA-45-right-104.png',
            category: 'Pistol',
            type: 'FIREARM',
            caliber: '9x19mm',
            action: 'Safe Action',
            capacity: '17+1',
            barrelLength: '4.49 inch',
            weight: '708g',
            description: 'The new frame design of the GLOCK 17 Gen5 removed the finger grooves for more versatility but still allows to easily customize its grip.',
            year: 2023,
        },
        {
            title: 'P320 NITRON COMPACT',
            manufacturerIndex: 1,
            price: 210000,
            imageUrl: 'https://www.sigsauer.com/media/catalog/product/cache/2f7933e2ff16f0ecad7f273575c3f3a2/p/3/p320-nitron-compact-hero_1.jpg',
            category: 'Pistol',
            type: 'FIREARM',
            caliber: '9mm Luger',
            action: 'Semi-Auto',
            capacity: '15+1',
            barrelLength: '3.9 inch',
            weight: '737g',
            description: 'The P320 offers a smooth, crisp trigger to make any shooter more accurate, an intuitive, 3-point takedown and unmatched modularity to fit any shooter and any situation.',
            year: 2024,
        },
        {
            title: 'M400 TREAD',
            manufacturerIndex: 1,
            price: 450000,
            imageUrl: 'https://www.sigsauer.com/media/catalog/product/cache/2f7933e2ff16f0ecad7f273575c3f3a2/r/m/rm400-16b-trd-right.jpg',
            category: 'Rifle',
            type: 'FIREARM',
            caliber: '5.56 NATO',
            action: 'Semi-Auto',
            capacity: '30+1',
            barrelLength: '16 inch',
            weight: '3.4 kg',
            description: 'The M400 TREAD is an optics ready, aluminum frame rifle. TREAD features a 16” stainless steel barrel with a free-floating M-LOK handguard.',
            year: 2024,
        },
        {
            title: '92FS',
            manufacturerIndex: 2,
            price: 175000,
            imageUrl: 'https://www.beretta.com/assets/12/15/DimLarge/92fs_right.png',
            category: 'Pistol',
            type: 'FIREARM',
            caliber: '9mm',
            action: 'DA/SA',
            capacity: '15+1',
            barrelLength: '4.9 inch',
            weight: '945g',
            description: 'The Beretta 92FS has been setting the standards for best military, police and tactical pistol for over a quarter century.',
            year: 2022,
        },
        {
            title: '1301 Tactical',
            manufacturerIndex: 2,
            price: 320000,
            imageUrl: 'https://www.beretta.com/assets/12/15/DimLarge/1301_Tactical_Right.png',
            category: 'Shotgun',
            type: 'FIREARM',
            caliber: '12 Gauge',
            action: 'Semi-Auto',
            capacity: '7+1',
            barrelLength: '18.5 inch',
            weight: '2.9 kg',
            description: 'The 1301 Tactical is Berettas new gas operated semi-automatic shotgun designed for law enforcement and home defense.',
            year: 2023,
        },
    ];

    for (const pData of productsData) {
        const product = await prisma.product.create({
            data: {
                title: pData.title,
                manufacturerId: manufacturers[pData.manufacturerIndex].id,
                manufacturerName: manufacturers[pData.manufacturerIndex].name, // Storing redundant name as per schema
                price: pData.price,
                imageUrl: pData.imageUrl,
                category: pData.category,
                type: pData.type as any, // Cast to enum
                caliber: pData.caliber,
                action: pData.action,
                capacity: pData.capacity,
                barrelLength: pData.barrelLength,
                weight: pData.weight,
                description: pData.description,
                year: pData.year,
                inStock: true,
            },
        });
        console.log('✅ Product created:', product.title);
    }

    // Create a sample customer
    const userPassword = await bcrypt.hash('user123', 10);
    const sampleUser = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            passwordHash: userPassword,
            fullName: 'John Doe',
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
