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
