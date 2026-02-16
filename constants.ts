
import { Product, Manufacturer, Exhibition, Conversation, SiteContent } from './types';

export const RATES = {
    PKR: 1,
    USD: 0.0036, // 1 PKR = 0.0036 USD (Approx)
    GBP: 0.0028
};

export const MOCK_MANUFACTURERS: Manufacturer[] = [
    { id: 'm1', name: 'Glock', countryOfOrigin: 'Austria', description: 'Perfection. The leading polymer pistol manufacturer.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Glock_Logo.svg/1200px-Glock_Logo.svg.png' },
    { id: 'm2', name: 'Sig Sauer', countryOfOrigin: 'Germany/USA', description: 'Born in Europe, Perfected in America.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Sig_Sauer_logo.svg/2560px-Sig_Sauer_logo.svg.png' },
    { id: 'm3', name: 'Beretta', countryOfOrigin: 'Italy', description: '500 Years of One Passion.', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Beretta_logo.svg/1200px-Beretta_logo.svg.png' }
];

export const MOCK_EXHIBITIONS: Exhibition[] = [
    { id: 'e1', title: 'Tactical Edge 2024', date: 'Oct 15 - Nov 30, 2024', location: 'Islamabad Expo', isVirtual: true, imageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f', description: 'Latest innovations in tactical gear.' },
    { id: 'e2', title: 'Precision Shooting', date: 'Dec 01 - Dec 20, 2024', location: 'Karachi Shooting Club', isVirtual: false, imageUrl: 'https://images.unsplash.com/photo-1594851225544-793310036662', description: 'Long range precision rifles showcase.' }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 'c1',
        title: 'Glock 19 Gen 5 Review',
        subtitle: 'The Gold Standard',
        category: 'WATCH',
        description: 'In-depth review of the most popular carry pistol in the world.',
        date: 'Oct 12, 2024',
        location: 'Range Day',
        duration: '14:20',
        thumbnailUrl: 'https://images.unsplash.com/photo-1585562133068-d621cc999912',
        videoId: 'dQw4w9WgXcQ'
    },
    {
        id: 'c2',
        title: 'Long range shooting basics',
        subtitle: 'Hitting steel at 1000 yards',
        category: 'LEARN',
        description: 'Master the art of reading wind and elevation.',
        date: 'Sep 28, 2024',
        location: 'Quetta',
        duration: '22:15',
        thumbnailUrl: 'https://images.unsplash.com/photo-1599318181673-9da54f3be799',
        videoId: 'dQw4w9WgXcQ'
    }
];

export const DEFAULT_SITE_CONTENT: SiteContent = {
    heroTitle: 'Defend & Protect',
    heroSubtitle: 'Premium Firearms. Trusted Brands. Unmatched Quality.',
    socialLinks: {
        instagram: 'https://instagram.com',
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
        pinterest: 'https://pinterest.com'
    },
    socialApiKeys: {
        facebookAppId: '',
        instagramClientId: ''
    }
};

export const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        title: 'Glock 19 Gen 5',
        manufacturerName: 'Glock',
        manufacturerId: 'm1',
        price: 450000,
        imageUrl: 'https://us.glock.com/-/media/Global/Cameras/GLOCK-19-Gen5-FS-MOS.png', // Placeholder URL
        category: 'Pistol',
        type: 'FIREARM',
        caliber: '9mm',
        action: 'Safe Action',
        capacity: '15+1',
        barrelLength: '4.02 inch',
        weight: '23.99 oz',
        year: 2023,
        description: 'The GLOCK 19 Gen5 FS MOS features the latest FS technology and MOS configuration.',
        inStock: true,
        reviews: [{ id: 'r1', userName: 'Ali K.', rating: 5, comment: 'Best carry gun.', date: '2023-11-12' }]
    },
    {
        id: '2',
        title: 'Sig Sauer P320',
        manufacturerName: 'Sig Sauer',
        manufacturerId: 'm2',
        price: 520000,
        imageUrl: 'https://www.sigsauer.com/media/catalog/product/cache/4113e33dfed959c5d1203b5736142347/3/2/320f-9-b-r2_02_web.jpg',
        category: 'Pistol',
        type: 'FIREARM',
        caliber: '9mm',
        action: 'Striker',
        capacity: '17+1',
        barrelLength: '4.7 inch',
        weight: '29.5 oz',
        year: 2024,
        description: 'Modular chassis system allowing for caliber and size conversions.',
        inStock: true,
        reviews: []
    },
    {
        id: '3',
        title: 'Beretta 1301 Tactical',
        manufacturerName: 'Beretta',
        manufacturerId: 'm3',
        price: 850000,
        imageUrl: 'https://www.beretta.com/assets/0/15/DimGalleryLarge/1301_Tactical_Marine_zoom002.jpg',
        category: 'Shotgun',
        type: 'FIREARM',
        caliber: '12 Gauge',
        action: 'Semi-Auto',
        capacity: '7+1',
        barrelLength: '18.5 inch',
        weight: '6.4 lbs',
        year: 2022,
        description: 'The ultimate tactical shotgun for home defense and law enforcement.',
        inStock: true,
        reviews: [{ id: 'r2', userName: 'Sarah M.', rating: 5, comment: 'Fast cycling.', date: '2024-01-05' }]
    },
    {
        id: '4',
        title: 'AK-103 Style Rifle',
        manufacturerName: 'Local Craft',
        manufacturerId: 'm_local',
        price: 250000,
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/AK-103.jpg/1200px-AK-103.jpg',
        category: 'Rifle',
        type: 'FIREARM',
        caliber: '7.62x39mm',
        action: 'Gas Operated',
        capacity: '30+1',
        barrelLength: '16.3 inch',
        weight: '3.6 kg',
        year: 2024,
        description: 'Robust and reliable, locally manufactured with precision.',
        inStock: true,
        reviews: []
    }
];

export const UI_TEXT = {
    EN: {
        nav: { gallery: 'Shop', artists: 'Brands', exhibitions: 'Collections', conversations: 'Journal', about: 'About', login: 'Login' },
        hero: { title: 'Defend & Protect', subtitle: 'Premium Firearms. Trusted Brands.' },
        cart: { title: 'Your Arsenal' }
    },
    UR: {
        nav: { gallery: 'دکان', artists: 'برانڈز', exhibitions: 'مجموعہ', conversations: 'جریدہ', about: 'ہمارے بارے میں', login: 'لاگ ان' },
        hero: { title: 'دفاع اور تحفظ', subtitle: 'اعلیٰ معیار کا اسلحہ۔ قابل اعتماد برانڈز۔' },
        cart: { title: 'آپ کا اسلحہ خانہ' }
    }
};
