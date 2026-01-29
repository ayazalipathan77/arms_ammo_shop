import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Artwork, Order, ShippingConfig, OrderStatus, Conversation, SiteContent, LandingPageContent } from '../types';
import { MOCK_CONVERSATIONS, DEFAULT_SITE_CONTENT } from '../constants';
import { artworkApi, transformArtwork, ArtworkFilters, adminApi, settingsApi, conversationApi, exhibitionApi } from '../services/api';
import { useAuth } from './AuthContext';

interface GalleryContextType {
  artworks: Artwork[];
  orders: Order[];
  shippingConfig: ShippingConfig;
  conversations: Conversation[];
  siteContent: SiteContent;
  landingPageContent: LandingPageContent | null;

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
  addArtwork: (art: any) => Promise<void>;
  updateArtwork: (id: string, updates: Partial<Artwork>) => Promise<void>;
  deleteArtwork: (id: string) => Promise<void>;

  // Order Actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus, tracking?: string) => Promise<void>;

  // Settings Actions
  updateShippingConfig: (config: ShippingConfig) => Promise<void>;
  updateSiteContent: (content: SiteContent) => Promise<void>;
  updateLandingPageContent: (content: LandingPageContent) => Promise<void>;
  refreshLandingPageContent: () => Promise<void>;

  // Conversation Actions
  addConversation: (conv: any) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;

  // Exhibition Actions
  exhibitions: any[];
  fetchExhibitions: () => Promise<void>;
  addExhibition: (exh: any) => Promise<void>;
  updateExhibition: (id: string, exh: any) => Promise<void>;
  deleteExhibition: (id: string) => Promise<void>;

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
  const { user } = useAuth();
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
  const [orders, setOrders] = useState<Order[]>([]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>({
    domesticRate: 0,
    internationalRate: 0,
    enableDHL: false,
    dhlApiKey: '',
    freeShippingThreshold: 0
  });
  const [landingPageContent, setLandingPageContent] = useState<LandingPageContent | null>(null);

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

  const fetchOrders = useCallback(async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const response = await adminApi.getAllOrders();
      // Map API orders to frontend Order type if needed, but they should be compatible
      setOrders(response.orders as any);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }, [user?.role]);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await conversationApi.getAll();
      setConversations(response.conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, []);

  const fetchExhibitions = useCallback(async () => {
    try {
      const response = await exhibitionApi.getAll();
      setExhibitions(response.exhibitions);
    } catch (err) {
      console.error('Error fetching exhibitions:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { settings } = await settingsApi.getSettings();
      if (settings.shippingConfig) setShippingConfig(settings.shippingConfig);
      if (settings.siteContent) setSiteContent(settings.siteContent);
      if (settings.landingPageContent) setLandingPageContent(settings.landingPageContent);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    fetchArtworks();
    fetchFilters();
    fetchConversations();
    fetchExhibitions();
    fetchSettings();
    if (user?.role === 'ADMIN') {
      fetchOrders();
    }
  }, [fetchArtworks, fetchFilters, fetchConversations, fetchSettings, fetchOrders, user?.role]);

  // --- Actions ---
  const addArtwork = async (artData: any) => {
    try {
      const response = await artworkApi.create(artData);
      setArtworks(prev => [transformArtwork(response.artwork), ...prev]);
    } catch (err) {
      console.error('Error adding artwork:', err);
      throw err;
    }
  };

  const updateArtwork = async (id: string, updates: Partial<Artwork>) => {
    try {
      const response = await artworkApi.update(id, updates as any);
      setArtworks(prev => prev.map(a => a.id === id ? transformArtwork(response.artwork) : a));
    } catch (err) {
      console.error('Error updating artwork:', err);
      throw err;
    }
  };

  const deleteArtwork = async (id: string) => {
    try {
      await artworkApi.delete(id);
      setArtworks(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting artwork:', err);
      throw err;
    }
  };

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, tracking?: string) => {
    try {
      await adminApi.updateOrderStatus(id, status, tracking);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status, trackingNumber: tracking || o.trackingNumber } : o));
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  const updateShippingConfig = async (config: ShippingConfig) => {
    try {
      await settingsApi.updateSetting('shippingConfig', config);
      setShippingConfig(config);
    } catch (err) {
      console.error('Error updating shipping config:', err);
      throw err;
    }
  };

  const updateSiteContent = async (content: SiteContent) => {
    try {
      await settingsApi.updateSetting('siteContent', content);
      setSiteContent(content);
    } catch (err) {
      console.error('Error updating site content:', err);
      throw err;
    }
  };

  const updateLandingPageContent = async (content: LandingPageContent) => {
    try {
      await settingsApi.updateSetting('landingPageContent', content);
      setLandingPageContent(content);
    } catch (err) {
      console.error('Error updating landing page content:', err);
      throw err;
    }
  };

  const refreshLandingPageContent = async () => {
    try {
      const { settings } = await settingsApi.getSettings();
      if (settings.landingPageContent) {
        setLandingPageContent(settings.landingPageContent);
      }
    } catch (err) {
      console.error('Error refreshing landing page content:', err);
      throw err;
    }
  };

  const addConversation = async (convData: any) => {
    try {
      const response = await conversationApi.create(convData);
      setConversations(prev => [response.conversation, ...prev]);
    } catch (err) {
      console.error('Error adding conversation:', err);
      throw err;
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await conversationApi.delete(id);
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw err;
    }
  };

  const addExhibition = async (exhData: any) => {
    try {
      const response = await exhibitionApi.create(exhData);
      setExhibitions(prev => [response.exhibition, ...prev]);
    } catch (err) {
      console.error('Error adding exhibition:', err);
      throw err;
    }
  };

  const updateExhibition = async (id: string, updates: any) => {
    try {
      const response = await exhibitionApi.update(id, updates);
      setExhibitions(prev => prev.map(e => e.id === id ? response.exhibition : e));
    } catch (err) {
      console.error('Error updating exhibition:', err);
      throw err;
    }
  };

  const deleteExhibition = async (id: string) => {
    try {
      await exhibitionApi.delete(id);
      setExhibitions(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting exhibition:', err);
      throw err;
    }
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
      landingPageContent,
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
      updateLandingPageContent,
      refreshLandingPageContent,
      addConversation,
      deleteConversation,
      exhibitions,
      fetchExhibitions,
      addExhibition,
      updateExhibition,
      deleteExhibition,
      stripeConnected,
      connectStripe,
      totalRevenue
    }}>
      {children}
    </GalleryContext.Provider>
  );
};
