
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, Order, ShippingConfig, OrderStatus, Conversation, SiteContent, LandingPageContent } from '../types';
import { DEFAULT_SITE_CONTENT } from '../constants';
import { artworkApi, transformArtwork, ArtworkFilters, orderApi, settingsApi, conversationApi, exhibitionApi, transformOrder } from '../services/api';
import { useAuth } from './AuthContext';

// Reusing existing API calls for now but they should be updated to 'productApi' in a full refactor
// For this task, we assume 'artworkApi' can handle 'products' if the backend is flexible or updated.
// I will keep the variable names for API calls but map them to the new types.

interface ShopContextType {
    products: Product[];
    orders: Order[];
    shippingConfig: ShippingConfig;
    conversations: Conversation[];
    siteContent: SiteContent;
    landingPageContent: LandingPageContent | null;

    isLoading: boolean;
    isContentLoading: boolean;
    error: string | null;

    availableCategories: string[];
    availableTypes: string[]; // Was mediums

    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };

    fetchProducts: (filters?: any) => Promise<void>;
    fetchFilters: () => Promise<void>;

    addProduct: (data: any) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    addOrder: (order: Order) => void;
    updateOrderStatus: (id: string, status: OrderStatus, tracking?: string) => Promise<void>;

    updateShippingConfig: (config: ShippingConfig) => Promise<void>;
    updateSiteContent: (content: SiteContent) => Promise<void>;
    updateLandingPageContent: (content: LandingPageContent) => Promise<void>;
    refreshLandingPageContent: () => Promise<void>;

    addConversation: (conv: any) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;

    collections: any[];
    fetchCollections: () => Promise<void>;
    addCollection: (col: any) => Promise<void>;
    updateCollection: (id: string, col: any) => Promise<void>;
    deleteCollection: (id: string) => Promise<void>;

    stripeConnected: boolean;
    connectStripe: () => void;
    totalRevenue: number;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const useShop = () => {
    const context = useContext(ShopContext);
    if (!context) throw new Error('useShop must be used within ShopProvider');
    return context;
};

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isContentLoading, setIsContentLoading] = useState(true);

    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [availableTypes, setAvailableTypes] = useState<string[]>([]);

    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
    });

    const [orders, setOrders] = useState<Order[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [collections, setCollections] = useState<any[]>([]); // Exhibitions -> Collections
    const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
    const [shippingConfig, setShippingConfig] = useState<ShippingConfig>({
        domesticRate: 0,
        internationalRate: 0,
        enableDHL: false,
        freeShippingThreshold: 0
    });
    const [landingPageContent, setLandingPageContent] = useState<LandingPageContent | null>(null);
    const [stripeConnected, setStripeConnected] = useState(false);

    // --- Fetch Actions ---
    const fetchProducts = useCallback(async (filters: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            // Using artworkApi but expecting Product data structure
            const response = await artworkApi.getAll(filters);
            // Transform needed if backend keys differ from frontend Keys
            // Assuming transformArtwork handles key mapping if needed
            const transformed = response.artworks.map(transformArtwork);
            setProducts(transformed as unknown as Product[]);
            setPagination(response.pagination);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch products');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchFilters = useCallback(async () => {
        try {
            const response = await artworkApi.getFilters();
            setAvailableCategories(response.categories);
            setAvailableTypes(response.mediums); // Mapping "mediums" from backend to "types"
        } catch (err) {
            console.error('Error fetching filters:', err);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        if (user?.role !== 'ADMIN') return;
        try {
            const response = await orderApi.getAllOrders();
            setOrders(response.orders.map(transformOrder));
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

    const fetchCollections = useCallback(async () => {
        try {
            const response = await exhibitionApi.getAll();
            setCollections(response.exhibitions);
        } catch (err) {
            console.error('Error fetching collections:', err);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            setIsContentLoading(true);
            const { settings } = await settingsApi.getSettings();
            if (settings.shippingConfig) setShippingConfig(settings.shippingConfig);
            if (settings.siteContent) setSiteContent(settings.siteContent);
            if (settings.landingPageContent) setLandingPageContent(settings.landingPageContent);
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setIsContentLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchFilters();
        fetchConversations();
        fetchCollections();
        fetchSettings();
        if (user?.role === 'ADMIN') {
            fetchOrders();
        }
    }, [fetchProducts, fetchFilters, fetchCollections, fetchConversations, fetchSettings, fetchOrders, user?.role]);

    // --- Actions ---
    const addProduct = async (data: any) => {
        try {
            const response = await artworkApi.create(data);
            const newProduct = transformArtwork(response.artwork) as unknown as Product;
            setProducts(prev => [newProduct, ...prev]);
        } catch (err) {
            console.error('Error adding product:', err);
            throw err;
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        try {
            const response = await artworkApi.update(id, updates as any);
            const updated = transformArtwork(response.artwork) as unknown as Product;
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
        } catch (err) {
            console.error('Error updating product:', err);
            throw err;
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            await artworkApi.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting product:', err);
            throw err;
        }
    };

    const addOrder = (order: Order) => {
        setOrders(prev => [order, ...prev]);
    };

    const updateOrderStatus = async (id: string, status: OrderStatus, tracking?: string) => {
        try {
            await orderApi.updateOrderStatus(id, { status: status as any, trackingNumber: tracking });
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

    const addConversation = async (data: any) => {
        try {
            const response = await conversationApi.create(data);
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

    const addCollection = async (data: any) => {
        try {
            const response = await exhibitionApi.create(data);
            setCollections(prev => [response.exhibition, ...prev]);
        } catch (err) {
            console.error('Error adding collection:', err);
            throw err;
        }
    };

    const updateCollection = async (id: string, updates: any) => {
        try {
            const response = await exhibitionApi.update(id, updates);
            setCollections(prev => prev.map(c => c.id === id ? response.exhibition : c));
        } catch (err) {
            console.error('Error updating collection:', err);
            throw err;
        }
    };

    const deleteCollection = async (id: string) => {
        try {
            await exhibitionApi.delete(id);
            setCollections(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting collection:', err);
            throw err;
        }
    };

    const connectStripe = () => {
        setTimeout(() => setStripeConnected(true), 1500);
    };

    const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalAmount : 0), 0);

    return (
        <ShopContext.Provider value={{
            products,
            orders,
            shippingConfig,
            conversations,
            siteContent,
            landingPageContent,
            isLoading,
            isContentLoading,
            error,
            availableCategories,
            availableTypes,
            pagination,
            fetchProducts,
            fetchFilters,
            addProduct,
            updateProduct,
            deleteProduct,
            addOrder,
            updateOrderStatus,
            updateShippingConfig,
            updateSiteContent,
            updateLandingPageContent,
            refreshLandingPageContent,
            addConversation,
            deleteConversation,
            collections,
            fetchCollections,
            addCollection,
            updateCollection,
            deleteCollection,
            stripeConnected,
            connectStripe,
            totalRevenue
        }}>
            {children}
        </ShopContext.Provider>
    );
};
