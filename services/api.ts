// Use relative URL for production (same-origin) or env variable for development
// Check if running on localhost, otherwise use relative path
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:5000/api' : '/api');

// Helper to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

// Helper to get CSRF token from cookies
const getCsrfToken = (): string | null => {
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    return match ? match[2] : null;
};

// Helper to handle token expiration
const handleTokenExpiration = () => {
    // Clear the invalid token
    localStorage.removeItem('authToken');
    // Show popup to user
    alert('Your session has expired. Please sign in again.');
    // Redirect to login page
    window.location.href = '/auth';
};

// Helper to make authenticated requests
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getAuthToken();
    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });
    
    // Check for 401 Unauthorized or token expiration
    if (response.status === 401) {
        const errorData = await response.json().catch(() => ({ message: 'Unauthorized' }));
        if (errorData.message?.toLowerCase().includes('token') || 
            errorData.message?.toLowerCase().includes('unauthorized') ||
            errorData.message?.toLowerCase().includes('expired')) {
            handleTokenExpiration();
            // After handling token expiration (clearing token, showing alert, redirecting),
            // we still need to throw to stop the current operation
            throw new Error('Session expired');
        }
        // For other 401 errors, throw the error
        throw new Error(errorData.message || 'Unauthorized');
    }
    
    return response;
};

// API Response types
export interface ApiArtwork {
    id: string;
    artistId: string | null;
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
    printOptions?: {
        enabled: boolean;
        sizes: Array<{
            name: string;
            dimensions: string;
            price: number;
        }>;
    } | null;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    artistName?: string;
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
    } | null;
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
    imageUrl?: string | null;
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
        artistName?: string;
        printOptions?: {
            enabled: boolean;
            sizes: Array<{ name: string; dimensions: string; price: number }>;
        } | null;
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
        printOptions?: {
            enabled: boolean;
            sizes: Array<{ name: string; dimensions: string; price: number }>;
        } | null;
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


    // Update artist profile (Artist owner only)
    updateProfile: async (id: string, data: { bio?: string; portfolioUrl?: string; originCity?: string; imageUrl?: string }): Promise<{ message: string; artist: ApiArtist }> => {
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
        artistName: apiArtwork.artist ? apiArtwork.artist.user.fullName : (apiArtwork.artistName || 'Unknown'),
        artistId: apiArtwork.artistId || undefined,
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
        printOptions: apiArtwork.printOptions ? {
            enabled: apiArtwork.printOptions.enabled,
            sizes: apiArtwork.printOptions.sizes || [],
        } : undefined,
    };
};

// Transform API artist to frontend Artist type
export const transformArtist = (apiArtist: ApiArtist): import('../types').Artist => {
    return {
        id: apiArtist.id,
        name: apiArtist.user.fullName,
        bio: apiArtist.bio || '',
        imageUrl: apiArtist.imageUrl || `https://picsum.photos/200/200?random=${apiArtist.id.slice(0, 8)}`,
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
        artistName?: string;
        artist: {
            user: {
                fullName: string;
            };
        } | null;
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
    let unitPrice = Number(apiCartItem.artwork.price);

    // For prints, look up the price from artwork's printOptions
    if (apiCartItem.type === 'PRINT' && apiCartItem.printSize && apiCartItem.artwork.printOptions) {
        const sizeOption = apiCartItem.artwork.printOptions.sizes.find(
            (s: { name: string; price: number }) => s.name === apiCartItem.printSize
        );
        if (sizeOption) {
            unitPrice = sizeOption.price;
        }
    }

    return {
        ...artwork,
        selectedPrintSize: apiCartItem.type === 'ORIGINAL'
            ? 'ORIGINAL'
            : apiCartItem.printSize || undefined,
        quantity: apiCartItem.quantity,
        finalPrice: unitPrice * apiCartItem.quantity,
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
            artistName: item.artwork.artistName || item.artwork.artist?.user.fullName || 'Unknown',
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
            selectedPrintSize: item.type === 'ORIGINAL' ? 'ORIGINAL' : item.printSize || undefined,
            quantity: item.quantity,
            finalPrice: parseFloat(item.priceAtPurchase) * item.quantity,
        })),
        totalAmount: parseFloat(apiOrder.totalAmount),
        currency: 'PKR' as any,
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

// Upload API
export const uploadApi = {
    uploadImage: async (file: File): Promise<string> => {
        const token = getAuthToken();
        const csrfToken = getCsrfToken();
        const formData = new FormData();
        formData.append('image', file);

        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload image');
        }

        const data = await response.json();
        return data.url;
    },
};

// Admin API
export const adminApi = {
    // Get Dashboard Stats
    getDashboardStats: async (): Promise<{ stats: any; recentOrders: any[] }> => {
        const response = await authFetch(`${API_URL}/admin/stats`);
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        return response.json();
    },

    // Get All Users
    getUsers: async (filters: { role?: string; search?: string } = {}): Promise<{ users: any[] }> => {
        const params = new URLSearchParams();
        if (filters.role) params.append('role', filters.role);
        if (filters.search) params.append('search', filters.search);

        const response = await authFetch(`${API_URL}/admin/users?${params}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    // Update User Role
    updateUserRole: async (id: string, role: string): Promise<{ message: string }> => {
        const response = await authFetch(`${API_URL}/admin/users/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
        if (!response.ok) throw new Error('Failed to update user role');
        return response.json();
    },

    // Delete User
    deleteUser: async (id: string): Promise<{ message: string }> => {
        const response = await authFetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete user');
        }
        return response.json();
    },

    // Get all orders (Admin only)
    getAllOrders: async (filters: any = {}): Promise<{
        orders: any[];
        pagination: PaginationInfo;
    }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, String(value));
            }
        });
        const response = await authFetch(`${API_URL}/orders?${params}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch all orders');
        }
        return response.json();
    },

    // Get single order details
    getOrderById: async (id: string): Promise<{ order: any }> => {
        const response = await authFetch(`${API_URL}/orders/${id}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch order');
        }
        return response.json();
    },

    // Request artist confirmation (Admin sends email to artist)
    requestArtistConfirmation: async (id: string): Promise<any> => {
        const response = await authFetch(`${API_URL}/orders/${id}/request-artist-confirmation`, {
            method: 'POST',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send artist confirmation request');
        }
        return response.json();
    },

    // Admin confirms order (after artist confirmation)
    adminConfirmOrder: async (id: string, notes?: string): Promise<any> => {
        const response = await authFetch(`${API_URL}/orders/${id}/confirm`, {
            method: 'PUT',
            body: JSON.stringify({ notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to confirm order');
        }
        return response.json();
    },

    // Mark order as shipped
    markOrderShipped: async (id: string, trackingNumber: string, carrier?: string, notes?: string): Promise<any> => {
        const response = await authFetch(`${API_URL}/orders/${id}/ship`, {
            method: 'PUT',
            body: JSON.stringify({ trackingNumber, carrier, notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to mark order as shipped');
        }
        return response.json();
    },

    // Mark order as delivered
    markOrderDelivered: async (id: string, notes?: string): Promise<any> => {
        const response = await authFetch(`${API_URL}/orders/${id}/deliver`, {
            method: 'PUT',
            body: JSON.stringify({ notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to mark order as delivered');
        }
        return response.json();
    },

    // Cancel order
    cancelOrder: async (id: string, reason?: string): Promise<any> => {
        const response = await authFetch(`${API_URL}/orders/${id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to cancel order');
        }
        return response.json();
    },

    // Update order notes
    updateOrderNotes: async (id: string, notes: string): Promise<any> => {
        const response = await authFetch(`${API_URL}/orders/${id}/notes`, {
            method: 'PUT',
            body: JSON.stringify({ notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update order notes');
        }
        return response.json();
    },
};

// User API
export const userApi = {
    getProfile: async (): Promise<{ user: any }> => {
        const response = await authFetch(`${API_URL}/users/profile`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        return response.json();
    },
    updateProfile: async (data: any): Promise<{ user: any; message: string }> => {
        const response = await authFetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update profile');
        return response.json();
    },
    addAddress: async (data: any): Promise<{ address: any; message: string }> => {
        const response = await authFetch(`${API_URL}/users/addresses`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to add address');
        return response.json();
    },
    deleteAddress: async (id: string): Promise<{ message: string }> => {
        const response = await authFetch(`${API_URL}/users/addresses/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete address');
        return response.json();
    }
};

// Shipping API
export const shippingApi = {
    getRates: async (data: { country: string; items?: any[] }): Promise<{ rates: any[] }> => {
        const csrfToken = getCsrfToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }
        const response = await fetch(`${API_URL}/shipping/rates`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch shipping rates');
        return response.json();
    }
};

// Settings API
export const settingsApi = {
    getSettings: async (): Promise<{ settings: Record<string, any> }> => {
        const response = await fetch(`${API_URL}/settings`);
        if (!response.ok) throw new Error('Failed to fetch settings');
        return response.json();
    },
    updateSetting: async (key: string, value: any): Promise<any> => {
        const response = await authFetch(`${API_URL}/settings`, {
            method: 'POST',
            body: JSON.stringify({ key, value }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update setting');
        }
        return response.json();
    }
};

// Conversation API
export const conversationApi = {
    getAll: async (): Promise<{ conversations: any[] }> => {
        const response = await fetch(`${API_URL}/conversations`);
        if (!response.ok) throw new Error('Failed to fetch conversations');
        return response.json();
    },
    create: async (data: any): Promise<any> => {
        const response = await authFetch(`${API_URL}/conversations`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create conversation');
        }
        return response.json();
    },
    update: async (id: string, data: any): Promise<any> => {
        const response = await authFetch(`${API_URL}/conversations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update conversation');
        }
        return response.json();
    },
    delete: async (id: string): Promise<any> => {
        const response = await authFetch(`${API_URL}/conversations/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete conversation');
        }
        return response.json();
    }
};

// Exhibition API
export const exhibitionApi = {
    getAll: async (params?: { status?: string; isVirtual?: boolean }): Promise<{ exhibitions: any[] }> => {
        const query = new URLSearchParams();
        if (params?.status) query.append('status', params.status);
        if (params?.isVirtual !== undefined) query.append('isVirtual', String(params.isVirtual));

        const response = await fetch(`${API_URL}/exhibitions?${query}`);
        if (!response.ok) throw new Error('Failed to fetch exhibitions');
        return response.json();
    },

    getById: async (id: string): Promise<{ exhibition: any }> => {
        const response = await fetch(`${API_URL}/exhibitions/${id}`);
        if (!response.ok) throw new Error('Failed to fetch exhibition');
        return response.json();
    },

    create: async (data: any): Promise<{ message: string; exhibition: any }> => {
        const response = await authFetch(`${API_URL}/exhibitions`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create exhibition');
        }
        return response.json();
    },

    update: async (id: string, data: any): Promise<{ message: string; exhibition: any }> => {
        const response = await authFetch(`${API_URL}/exhibitions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update exhibition');
        }
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const response = await authFetch(`${API_URL}/exhibitions/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete exhibition');
    }
};

// Favorites API
export const favoriteApi = {
    getAll: async (): Promise<{ favorites: any[] }> => {
        const response = await authFetch(`${API_URL}/favorites`);
        if (!response.ok) throw new Error('Failed to fetch favorites');
        return response.json();
    },

    getCount: async (): Promise<{ count: number }> => {
        const response = await authFetch(`${API_URL}/favorites/count`);
        if (!response.ok) throw new Error('Failed to fetch favorites count');
        return response.json();
    },

    checkIsFavorited: async (artworkId: string): Promise<{ isFavorited: boolean }> => {
        const response = await authFetch(`${API_URL}/favorites/check/${artworkId}`);
        if (!response.ok) throw new Error('Failed to check favorite status');
        return response.json();
    },

    add: async (artworkId: string): Promise<{ message: string; favorite: any }> => {
        const response = await authFetch(`${API_URL}/favorites/${artworkId}`, {
            method: 'POST',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add to favorites');
        }
        return response.json();
    },

    remove: async (artworkId: string): Promise<{ message: string }> => {
        const response = await authFetch(`${API_URL}/favorites/${artworkId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove from favorites');
        }
        return response.json();
    },
};

// Review API
export const reviewApi = {
    getArtworkReviews: async (artworkId: string, approved: boolean = true): Promise<{ reviews: any[]; stats: any }> => {
        const query = approved ? '?approved=true' : '';
        const response = await fetch(`${API_URL}/reviews/artwork/${artworkId}${query}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        return response.json();
    },

    createReview: async (data: {
        artworkId: string;
        rating: number;
        comment?: string;
        photos?: string[];
    }): Promise<{ message: string; review: any }> => {
        const response = await authFetch(`${API_URL}/reviews`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit review');
        }
        return response.json();
    },

    updateReview: async (reviewId: string, data: {
        rating?: number;
        comment?: string;
        photos?: string[];
    }): Promise<{ message: string; review: any }> => {
        const response = await authFetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update review');
        }
        return response.json();
    },

    deleteReview: async (reviewId: string): Promise<{ message: string }> => {
        const response = await authFetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete review');
        }
        return response.json();
    },

    voteReview: async (reviewId: string, helpful: boolean): Promise<{ message: string; review: any }> => {
        const csrfToken = getCsrfToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }
        const response = await fetch(`${API_URL}/reviews/${reviewId}/vote`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ helpful }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to vote on review');
        }
        return response.json();
    },

    // Admin endpoints
    getAllForModeration: async (status?: 'pending' | 'approved' | 'rejected'): Promise<{ reviews: any[] }> => {
        const query = status ? `?status=${status}` : '';
        const response = await authFetch(`${API_URL}/reviews/moderation/all${query}`);
        if (!response.ok) throw new Error('Failed to fetch reviews for moderation');
        return response.json();
    },

    approveReview: async (reviewId: string): Promise<{ message: string; review: any }> => {
        const response = await authFetch(`${API_URL}/reviews/${reviewId}/approve`, {
            method: 'PUT',
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to approve review');
        }
        return response.json();
    },

    rejectReview: async (reviewId: string, reason: string): Promise<{ message: string; review: any }> => {
        const response = await authFetch(`${API_URL}/reviews/${reviewId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to reject review');
        }
        return response.json();
    },
};
