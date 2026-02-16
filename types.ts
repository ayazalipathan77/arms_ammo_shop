
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
  MANUFACTURER = 'MANUFACTURER' // Was ARTIST
}

export enum Currency {
  PKR = 'PKR',
  USD = 'USD',
  GBP = 'GBP'
}

export type OrderStatus = 'PENDING' | 'PAID' | 'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface ShippingConfig {
  domesticRate: number;
  internationalRate: number;
  enableDHL: boolean;
  dhlApiKey?: string;
  freeShippingThreshold: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  favorites: string[];
  phoneNumber?: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  type: 'SHIPPING' | 'BILLING';
  address: string;
  city: string;
  country: string;
  zipCode?: string;
  isDefault: boolean;
}

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  userId?: string;
}

// Keeping print options for now as generic "Options" or maybe "Accessory bundles" later?
export interface ProductOption {
  name: string;        
  description: string;
  price: number; 
}

export interface ProductOptions {
  enabled: boolean;
  options: ProductOption[];
}

export type ProductType = 'FIREARM' | 'AMMO' | 'OPTIC' | 'ACCESSORY';

export interface Product { // Was Artwork
  id: string;
  title: string;
  manufacturerName: string; // Was artistName
  manufacturerId?: string;  // Was artistId
  price: number; // Base price in PKR
  imageUrl: string;
  
  // Gun Specifics
  category: string; // e.g., 'Pistol', 'Rifle'
  type: ProductType;
  caliber?: string;
  action?: string;
  capacity?: string;
  barrelLength?: string;
  weight?: string;

  description: string;
  inStock: boolean;
  reviews: Review[];
  
  // Legacy fields mapped or kept for compatibility if needed
  year: number; 
  additionalImages?: string[];
}

export interface CartItem extends Product {
  quantity: number;
  finalPrice: number; 
  selectedOption?: string; // For things like "Extra Mag" (was printSize)
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  totalAmount: number;
  currency: Currency;
  status: OrderStatus;
  date: Date;
  shippingAddress: string;
  shippingCountry: string;
  trackingNumber?: string;
  paymentMethod: 'STRIPE' | 'BANK';
  transactionId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Exhibition -> Featured Collection / Sale
export interface Exhibition {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  imageUrl: string;
  galleryImages?: string[];
  videoUrl?: string;
  isVirtual: boolean;
  status: 'UPCOMING' | 'CURRENT' | 'PAST';
}

export interface Manufacturer { // Was Artist
  id: string;
  name: string;
  description: string; // Was bio
  imageUrl: string;
  countryOfOrigin: string; // Was specialty
}

export interface Conversation {
  id: string;
  title: string;
  subtitle: string;
  category: 'WATCH' | 'LISTEN' | 'LEARN';
  description: string;
  date: string;
  location?: string;
  duration?: string;
  thumbnailUrl: string;
  videoId: string; // YouTube ID
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  twitter: string;
  pinterest: string;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  socialLinks: SocialLinks;
  socialApiKeys: {
    facebookAppId?: string;
    instagramClientId?: string;
  };
}

export interface LandingPageHero {
  enabled: boolean;
  title: string;
  subtitle: string;
  accentWord: string;
  backgroundImage: string;
  backgroundImages?: string[];
}

export interface LandingPageFeaturedExhibition {
  enabled: boolean;
  exhibitionId: string | null;
  manualOverride?: {
    title: string;
    artistName: string; // Keep as string key but label as Brand in UI
    description: string;
    date: string;
    imageUrl: string;
  };
}

export interface LandingPageCollection {
  id: string;
  title: string;
  description?: string;
  artworkIds: string[]; // Maps to productIds
  imageUrl?: string;
  layout: 'large' | 'tall' | 'normal';
}

export interface LandingPageCuratedCollections {
  enabled: boolean;
  collections: LandingPageCollection[];
}

export interface LandingPageTopPaintings { // Rename logically in UI, keep key for now
  enabled: boolean;
  artworkIds: string[];
}

export interface LandingPageJournal {
  enabled: boolean;
  featuredConversationIds: string[];
}

export interface LandingPageContent {
  hero: LandingPageHero;
  featuredExhibition: LandingPageFeaturedExhibition;
  curatedCollections: LandingPageCuratedCollections;
  topPaintings: LandingPageTopPaintings;
  muraqQaJournal: LandingPageJournal;
}
