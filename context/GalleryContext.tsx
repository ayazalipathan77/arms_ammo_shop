import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Artwork, Order, ShippingConfig, OrderStatus, Conversation, SiteContent } from '../types';
import { MOCK_CONVERSATIONS, DEFAULT_SITE_CONTENT } from '../constants';
import { artworkApi, transformArtwork, ArtworkFilters } from '../services/api';

interface GalleryContextType {
  artworks: Artwork[];
  orders: Order[];
  shippingConfig: ShippingConfig;
  conversations: Conversation[];
  siteContent: SiteContent;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Filters data
  availableCategories: string[];
  availableMediums: string[];

  // Pagination
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  // Fetch actions
  fetchArtworks: (filters?: ArtworkFilters) => Promise<void>;
  fetchFilters: () => Promise<void>;

  // Inventory Actions
  addArtwork: (art: Artwork) => void;
  updateArtwork: (id: string, updates: Partial<Artwork>) => void;
  deleteArtwork: (id: string) => void;

  // Order Actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus, tracking?: string) => void;

  // Settings Actions
  updateShippingConfig: (config: Partial<ShippingConfig>) => void;
  updateSiteContent: (content: Partial<SiteContent>) => void;

  // Conversation Actions
  addConversation: (conv: Conversation) => void;
  deleteConversation: (id: string) => void;

  // Financials (Mock)
  stripeConnected: boolean;
  connectStripe: () => void;
  totalRevenue: number;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) throw new Error('useGallery must be used within GalleryProvider');
  return context;
};

export const GalleryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Inventory State ---
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filters State ---
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableMediums, setAvailableMediums] = useState<string[]>([]);

  // --- Pagination State ---
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  // --- Order State (Mock Initial Data) ---
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-001',
      customerName: 'Ali Khan',
      customerEmail: 'ali@example.com',
      items: [],
      totalAmount: 450000,
      currency: 'PKR' as any,
      status: 'SHIPPED',
      date: new Date('2023-11-15'),
      shippingAddress: '123 DHA Phase 6, Lahore',
      shippingCountry: 'Pakistan',
      trackingNumber: 'DHL-9928382',
      paymentMethod: 'STRIPE',
      transactionId: 'pi_3M9x8K2eZvKylo2C1x5y8'
    },
    {
      id: 'ORD-002',
      customerName: 'John Smith',
      customerEmail: 'john@london.co.uk',
      items: [],
      totalAmount: 950000,
      currency: 'PKR' as any,
      status: 'PROCESSING',
      date: new Date('2024-01-20'),
      shippingAddress: '45 Baker St, London',
      shippingCountry: 'UK',
      paymentMethod: 'STRIPE',
      transactionId: 'pi_3N5j1L2eZvKylo2C9a2b1'
    }
  ]);

  // --- Content State ---
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);

  // --- Settings State ---
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>({
    domesticRate: 500,
    internationalRate: 8500,
    enableDHL: true,
    dhlApiKey: 'MOCK_DHL_KEY_123',
    freeShippingThreshold: 1000000
  });

  const [stripeConnected, setStripeConnected] = useState(false);

  // --- Fetch Actions ---
  const fetchArtworks = useCallback(async (filters: ArtworkFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await artworkApi.getAll(filters);
      const transformedArtworks = response.artworks.map(transformArtwork);
      setArtworks(transformedArtworks);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching artworks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch artworks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFilters = useCallback(async () => {
    try {
      const response = await artworkApi.getFilters();
      setAvailableCategories(response.categories);
      setAvailableMediums(response.mediums);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    fetchArtworks();
    fetchFilters();
  }, [fetchArtworks, fetchFilters]);

  // --- Actions ---
  const addArtwork = (art: Artwork) => {
    setArtworks(prev => [art, ...prev]);
  };

  const updateArtwork = (id: string, updates: Partial<Artwork>) => {
    setArtworks(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteArtwork = (id: string) => {
    setArtworks(prev => prev.filter(a => a.id !== id));
  };

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateOrderStatus = (id: string, status: OrderStatus, tracking?: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, trackingNumber: tracking || o.trackingNumber } : o));
  };

  const updateShippingConfig = (config: Partial<ShippingConfig>) => {
    setShippingConfig(prev => ({ ...prev, ...config }));
  };

  const updateSiteContent = (content: Partial<SiteContent>) => {
    setSiteContent(prev => ({ ...prev, ...content }));
  };

  const addConversation = (conv: Conversation) => {
    setConversations(prev => [conv, ...prev]);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  const connectStripe = () => {
    setTimeout(() => setStripeConnected(true), 1500);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalAmount : 0), 0);

  return (
    <GalleryContext.Provider value={{
      artworks,
      orders,
      shippingConfig,
      conversations,
      siteContent,
      isLoading,
      error,
      availableCategories,
      availableMediums,
      pagination,
      fetchArtworks,
      fetchFilters,
      addArtwork,
      updateArtwork,
      deleteArtwork,
      addOrder,
      updateOrderStatus,
      updateShippingConfig,
      updateSiteContent,
      addConversation,
      deleteConversation,
      stripeConnected,
      connectStripe,
      totalRevenue
    }}>
      {children}
    </GalleryContext.Provider>
  );
};
