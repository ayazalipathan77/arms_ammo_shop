const API_URL = 'http://localhost:5000/api';

// Helper to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

// Helper to make authenticated requests
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, { ...options, headers });
};

// API Response types
export interface ApiArtwork {
    id: string;
    artistId: string;
    title: string;
    description: string | null;
    price: string; // Decimal comes as string from Prisma
    currency: string;
    category: string;
    medium: string;
    dimensions: string | null;
    imageUrl: string;
    thumbnailUrl: string | null;
    additionalImages: string[];
    provenanceHash: string | null;
    year: number;
    isAuction: boolean;
    inStock: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    artist: {
        id: string;
        userId: string;
        bio: string | null;
        portfolioUrl: string | null;
        originCity: string | null;
        createdAt: string;
        updatedAt: string;
        user: {
            id: string;
            fullName: string;
            email: string;
        };
    };
    reviews?: ApiReview[];
}

export interface ApiReview {
    id: string;
    userId: string;
    artworkId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
    };
}

export interface ApiArtist {
    id: string;
    userId: string;
    bio: string | null;
    portfolioUrl: string | null;
    originCity: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        fullName: string;
        email: string;
        createdAt?: string;
    };
    artworks?: ApiArtwork[];
    _count?: {
        artworks: number;
    };
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ArtworkFilters {
    category?: string;
    medium?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    artistId?: string;
    inStock?: boolean;
    isAuction?: boolean;
    sortBy?: 'price' | 'createdAt' | 'title' | 'year';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface ArtworkFiltersResponse {
    categories: string[];
    mediums: string[];
}

// Artwork API
export const artworkApi = {
    // Get all artworks with optional filters
    getAll: async (filters: ArtworkFilters = {}): Promise<{ artworks: ApiArtwork[]; pagination: PaginationInfo }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });

        const response = await fetch(`${API_URL}/artworks?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch artworks');
        }
        return response.json();
    },

    // Get single artwork by ID
    getById: async (id: string): Promise<{ artwork: ApiArtwork }> => {
        const response = await fetch(`${API_URL}/artworks/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch artwork');
        }
        return response.json();
    },

    // Get artworks by artist
    getByArtist: async (artistId: string, filters: ArtworkFilters = {}): Promise<{ artworks: ApiArtwork[]; pagination: PaginationInfo }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });

        const response = await fetch(`${API_URL}/artworks/artist/${artistId}?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch artist artworks');
        }
        return response.json();
    },

    // Get available filters (categories and mediums)
    getFilters: async (): Promise<ArtworkFiltersResponse> => {
        const response = await fetch(`${API_URL}/artworks/filters`);
        if (!response.ok) {
            throw new Error('Failed to fetch filters');
        }
        return response.json();
    },

    // Create artwork (Artist only)
    create: async (data: {
        title: string;
        description?: string;
        price: number;
        currency?: string;
        category: string;
        medium: string;
        dimensions?: string;
        imageUrl: string;
        year: number;
        isAuction?: boolean;
        inStock?: boolean;
    }): Promise<{ message: string; artwork: ApiArtwork }> => {
        const response = await authFetch(`${API_URL}/artworks`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create artwork');
        }
        return response.json();
    },

    // Update artwork (Artist only)
    update: async (id: string, data: Partial<{
        title: string;
        description: string;
        price: number;
        currency: string;
        category: string;
        medium: string;
        dimensions: string;
        imageUrl: string;
        year: number;
        isAuction: boolean;
        inStock: boolean;
    }>): Promise<{ message: string; artwork: ApiArtwork }> => {
        const response = await authFetch(`${API_URL}/artworks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update artwork');
        }
        return response.json();
    },

    // Delete artwork (Artist only)
    delete: async (id: string): Promise<{ message: string }> => {
        const response = await authFetch(`${API_URL}/artworks/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete artwork');
        }
        return response.json();
    },
};

// Artist API
export const artistApi = {
    // Get all artists
    getAll: async (filters: {
        search?: string;
        originCity?: string;
        sortBy?: 'createdAt' | 'fullName';
        sortOrder?: 'asc' | 'desc';
        page?: number;
        limit?: number;
    } = {}): Promise<{ artists: ApiArtist[]; pagination: PaginationInfo }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });

        const response = await fetch(`${API_URL}/artists?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch artists');
        }
        return response.json();
    },

    // Get single artist by ID
    getById: async (id: string): Promise<{ artist: ApiArtist }> => {
        const response = await fetch(`${API_URL}/artists/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch artist');
        }
        return response.json();
    },

    // Get artist by user ID
    getByUserId: async (userId: string): Promise<{ artist: ApiArtist }> => {
        const response = await fetch(`${API_URL}/artists/user/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch artist');
        }
        return response.json();
    },

    // Get current artist profile (for logged in artist)
    getMyProfile: async (): Promise<{ artist: ApiArtist }> => {
        const response = await authFetch(`${API_URL}/artists/me`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch profile');
        }
        return response.json();
    },

    // Update artist profile
    updateProfile: async (id: string, data: {
        bio?: string;
        portfolioUrl?: string;
        originCity?: string;
    }): Promise<{ message: string; artist: ApiArtist }> => {
        const response = await authFetch(`${API_URL}/artists/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }
        return response.json();
    },

    // Get artist stats
    getStats: async (id: string): Promise<{
        stats: {
            totalArtworks: number;
            inStockCount: number;
            soldCount: number;
            totalRevenue: number;
            totalSales: number;
            averagePrice: number;
        };
        recentOrders: any[];
    }> => {
        const response = await authFetch(`${API_URL}/artists/${id}/stats`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch stats');
        }
        return response.json();
    },
};

// Transform API artwork to frontend Artwork type
export const transformArtwork = (apiArtwork: ApiArtwork): import('../types').Artwork => {
    return {
        id: apiArtwork.id,
        title: apiArtwork.title,
        artistName: apiArtwork.artist.user.fullName,
        artistId: apiArtwork.artistId,
        price: parseFloat(apiArtwork.price),
        imageUrl: apiArtwork.imageUrl,
        medium: apiArtwork.medium,
        dimensions: apiArtwork.dimensions || '',
        year: apiArtwork.year,
        description: apiArtwork.description || '',
        category: apiArtwork.category as any,
        inStock: apiArtwork.inStock,
        provenanceId: apiArtwork.provenanceHash || undefined,
        reviews: (apiArtwork.reviews || []).map(r => ({
            id: r.id,
            userName: r.user.fullName,
            rating: r.rating,
            comment: r.comment || '',
            date: new Date(r.createdAt).toLocaleDateString(),
            userId: r.userId,
        })),
        isAuction: apiArtwork.isAuction,
    };
};

// Transform API artist to frontend Artist type
export const transformArtist = (apiArtist: ApiArtist): import('../types').Artist => {
    return {
        id: apiArtist.id,
        name: apiArtist.user.fullName,
        bio: apiArtist.bio || '',
        imageUrl: `https://picsum.photos/200/200?random=${apiArtist.id.slice(0, 8)}`,
        specialty: apiArtist.originCity || 'Contemporary Art',
    };
};

// Cart API types
export interface ApiCartItem {
    id: string;
    userId: string;
    artworkId: string;
    quantity: number;
    type: 'ORIGINAL' | 'PRINT';
    printSize: string | null;
    createdAt: string;
    updatedAt: string;
    artwork: ApiArtwork;
}

export interface CartSummary {
    itemCount: number;
    totalQuantity: number;
    subtotal: number;
}

// Order API types
export interface ApiOrderItem {
    id: string;
    orderId: string;
    artworkId: string;
    quantity: number;
    priceAtPurchase: string;
    type: 'ORIGINAL' | 'PRINT';
    printSize: string | null;
    artwork: {
        id: string;
        title: string;
        imageUrl: string;
        dimensions?: string;
        medium?: string;
        artist: {
            user: {
                fullName: string;
            };
        };
    };
}

export interface ApiOrder {
    id: string;
    userId: string;
    totalAmount: string;
    status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    shippingAddress: string;
    trackingNumber: string | null;
    paymentMethod: 'STRIPE' | 'BANK';
    createdAt: string;
    updatedAt: string;
    items: ApiOrderItem[];
    user: {
        id: string;
        fullName: string;
        email: string;
    };
}

// Cart API
export const cartApi = {
    // Get user's cart
    getCart: async (): Promise<{ cartItems: ApiCartItem[]; summary: CartSummary }> => {
        const response = await authFetch(`${API_URL}/cart`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch cart');
        }
        return response.json();
    },

    // Add item to cart
    addToCart: async (data: {
        artworkId: string;
        quantity?: number;
        type?: 'ORIGINAL' | 'PRINT';
        printSize?: string;
    }): Promise<{ message: string; cartItem: ApiCartItem }> => {
        const response = await authFetch(`${API_URL}/cart`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add to cart');
        }
        return response.json();
    },

    // Update cart item quantity
    updateCartItem: async (itemId: string, quantity: number): Promise<{ message: string; cartItem: ApiCartItem }> => {
        const response = await authFetch(`${API_URL}/cart/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update cart item');
        }
        return response.json();
    },

    // Remove item from cart
    removeFromCart: async (itemId: string): Promise<{ message: string }> => {
        const response = await authFetch(`${API_URL}/cart/${itemId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove from cart');
        }
        return response.json();
    },

    // Clear entire cart
    clearCart: async (): Promise<{ message: string }> => {
        const response = await authFetch(`${API_URL}/cart`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to clear cart');
        }
        return response.json();
    },
};

// Order API
export const orderApi = {
    // Create a new order
    createOrder: async (data: {
        items: Array<{
            artworkId: string;
            quantity: number;
            type: 'ORIGINAL' | 'PRINT';
            printSize?: string;
        }>;
        shippingAddress: string;
        shippingCity: string;
        shippingCountry: string;
        paymentMethod: 'STRIPE' | 'BANK';
        currency?: 'PKR' | 'USD' | 'GBP';
        notes?: string;
    }): Promise<{ message: string; order: ApiOrder }> => {
        const response = await authFetch(`${API_URL}/orders`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create order');
        }
        return response.json();
    },

    // Get user's orders
    getUserOrders: async (filters: {
        status?: string;
        page?: number;
        limit?: number;
        sortBy?: 'createdAt' | 'totalAmount' | 'status';
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{ orders: ApiOrder[]; pagination: PaginationInfo }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });

        const response = await authFetch(`${API_URL}/orders?${params}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch orders');
        }
        return response.json();
    },

    // Get single order by ID
    getOrderById: async (id: string): Promise<{ order: ApiOrder }> => {
        const response = await authFetch(`${API_URL}/orders/${id}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch order');
        }
        return response.json();
    },

    // Cancel order
    cancelOrder: async (id: string): Promise<{ message: string }> => {
        const response = await authFetch(`${API_URL}/orders/${id}/cancel`, {
            method: 'PUT',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to cancel order');
        }
        return response.json();
    },

    // Get all orders (Admin only)
    getAllOrders: async (filters: {
        status?: string;
        page?: number;
        limit?: number;
        sortBy?: 'createdAt' | 'totalAmount' | 'status';
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        orders: ApiOrder[];
        pagination: PaginationInfo;
        summary: {
            totalOrders: number;
            totalRevenue: number;
            pendingCount: number;
            paidCount: number;
            shippedCount: number;
        };
    }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });

        const response = await authFetch(`${API_URL}/orders/admin?${params}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch orders');
        }
        return response.json();
    },

    // Update order status (Admin only)
    updateOrderStatus: async (id: string, data: {
        status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
        trackingNumber?: string;
    }): Promise<{ message: string; order: ApiOrder }> => {
        const response = await authFetch(`${API_URL}/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update order status');
        }
        return response.json();
    },
};

// Transform API cart item to frontend CartItem type
export const transformCartItem = (apiCartItem: ApiCartItem): import('../types').CartItem => {
    const artwork = transformArtwork(apiCartItem.artwork);
    return {
        ...artwork,
        selectedPrintSize: apiCartItem.type === 'ORIGINAL'
            ? 'ORIGINAL'
            : (apiCartItem.printSize as 'A4' | 'A3' | 'CANVAS_24x36') || 'A4',
        quantity: apiCartItem.quantity,
        finalPrice: Number(apiCartItem.artwork.price) * apiCartItem.quantity,
    };
};

// Transform API order to frontend Order type
export const transformOrder = (apiOrder: ApiOrder): import('../types').Order => {
    return {
        id: apiOrder.id,
        customerName: apiOrder.user.fullName,
        customerEmail: apiOrder.user.email,
        items: apiOrder.items.map(item => ({
            id: item.artwork.id,
            title: item.artwork.title,
            artistName: item.artwork.artist.user.fullName,
            artistId: '',
            price: parseFloat(item.priceAtPurchase),
            imageUrl: item.artwork.imageUrl,
            medium: item.artwork.medium || '',
            dimensions: item.artwork.dimensions || '',
            year: 0,
            description: '',
            category: 'Abstract' as const,
            inStock: true,
            reviews: [],
            selectedPrintSize: item.type === 'ORIGINAL' ? 'ORIGINAL' : (item.printSize as any) || 'A4',
            quantity: item.quantity,
            finalPrice: parseFloat(item.priceAtPurchase) * item.quantity,
        })),
        totalAmount: parseFloat(apiOrder.totalAmount),
        currency: 'PKR' as const,
        status: apiOrder.status,
        date: new Date(apiOrder.createdAt),
        shippingAddress: apiOrder.shippingAddress,
        shippingCountry: apiOrder.shippingAddress.split(', ').pop() || '',
        trackingNumber: apiOrder.trackingNumber || undefined,
        paymentMethod: apiOrder.paymentMethod,
        transactionId: undefined,
    };
};

// Payment API types
export interface StripeConfig {
    enabled: boolean;
    publishableKey?: string;
    message?: string;
}

export interface PaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
}

export interface PaymentStatus {
    orderId: string;
    status: string;
    paymentMethod: 'STRIPE' | 'BANK';
    amount: number;
    isPaid: boolean;
}

// Payment API
export const paymentApi = {
    // Get Stripe configuration
    getConfig: async (): Promise<StripeConfig> => {
        const response = await fetch(`${API_URL}/payments/config`);
        if (!response.ok) {
            throw new Error('Failed to get payment configuration');
        }
        return response.json();
    },

    // Create a payment intent
    createPaymentIntent: async (data: {
        orderId: string;
        currency?: 'pkr' | 'usd' | 'gbp';
    }): Promise<PaymentIntentResponse> => {
        const response = await authFetch(`${API_URL}/payments/create-intent`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create payment intent');
        }
        return response.json();
    },

    // Get payment status for an order
    getPaymentStatus: async (orderId: string): Promise<PaymentStatus> => {
        const response = await authFetch(`${API_URL}/payments/${orderId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get payment status');
        }
        return response.json();
    },

    // Confirm bank transfer (Admin only)
    confirmBankTransfer: async (data: {
        orderId: string;
        transactionReference: string;
        notes?: string;
    }): Promise<{ message: string; order: ApiOrder }> => {
        const response = await authFetch(`${API_URL}/payments/confirm-bank-transfer`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to confirm bank transfer');
        }
        return response.json();
    },
};
