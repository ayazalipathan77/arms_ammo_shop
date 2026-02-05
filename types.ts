
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
  ARTIST = 'ARTIST'
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

export interface PrintSizeOption {
  name: string;        // e.g., "A3", "24x36"
  dimensions: string;  // e.g., "11.7 x 16.5 inches"
  price: number;       // Price in PKR
}

export interface PrintOptions {
  enabled: boolean;
  sizes: PrintSizeOption[];
}

export interface Artwork {
  id: string;
  title: string;
  artistName: string;
  artistId?: string;
  price: number; // Base price in PKR
  imageUrl: string;
  medium: string;
  dimensions: string; // e.g., "24x36"
  year: number;
  description: string;
  category: 'Calligraphy' | 'Landscape' | 'Abstract' | 'Miniature' | 'Portrait';
  inStock: boolean;
  provenanceId?: string;
  reviews: Review[];
  isAuction?: boolean;
  auctionEndTime?: Date;
  printOptions?: PrintOptions;
}

export interface CartItem extends Artwork {
  selectedPrintSize?: string;
  quantity: number;
  finalPrice: number; // Price after print selection and currency conversion
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

export interface Artist {
  id: string;
  name: string;
  bio: string;
  imageUrl: string;
  specialty: string;
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
    artistName: string;
    description: string;
    date: string;
    imageUrl: string;
  };
}

export interface LandingPageCollection {
  id: string;
  title: string;
  artworkIds: string[];
  imageUrl?: string;
  layout: 'large' | 'tall' | 'normal';
}

export interface LandingPageCuratedCollections {
  enabled: boolean;
  collections: LandingPageCollection[];
}

export interface LandingPageTopPaintings {
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
