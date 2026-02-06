import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem } from '../types';
import { cartApi, transformCartItem, ApiCartItem } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
    cart: CartItem[];
    cartItemIds: Map<string, string>; // artworkId -> cartItemId mapping
    isLoading: boolean;
    error: string | null;
    addToCart: (item: CartItem) => Promise<void>;
    removeFromCart: (artworkId: string) => Promise<void>;
    updateQuantity: (artworkId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCartContext must be used within CartProvider');
    }
    return context;
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const { token, user } = useAuth();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartItemIds, setCartItemIds] = useState<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + item.finalPrice, 0);

    // Fetch cart from API
    const refreshCart = useCallback(async () => {
        if (!token || !user) {
            setCart([]);
            setCartItemIds(new Map());
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await cartApi.getCart();
            const transformedItems = response.cartItems.map(transformCartItem);

            // Build the artworkId -> cartItemId map
            const idMap = new Map<string, string>();
            response.cartItems.forEach((item: ApiCartItem) => {
                idMap.set(item.artworkId, item.id);
            });

            setCart(transformedItems);
            setCartItemIds(idMap);
        } catch (err: any) {
            console.error('Failed to fetch cart:', err);
            setError(err.message || 'Failed to fetch cart');
            // Don't block the UI - set empty cart on error
            setCart([]);
            setCartItemIds(new Map());
        } finally {
            setIsLoading(false);
        }
    }, [token, user]);

    // Load cart when user logs in
    useEffect(() => {
        if (token && user) {
            refreshCart();
        } else {
            // Clear cart when logged out
            setCart([]);
            setCartItemIds(new Map());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, user]); // refreshCart is intentionally omitted to prevent infinite loop

    // Add item to cart
    const addToCart = async (item: CartItem) => {
        if (!token) {
            setError('Please log in to add items to cart');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await cartApi.addToCart({
                artworkId: item.id,
                quantity: item.quantity || 1,
                type: item.selectedPrintSize === 'ORIGINAL' ? 'ORIGINAL' : 'PRINT',
                printSize: item.selectedPrintSize !== 'ORIGINAL' ? item.selectedPrintSize : undefined,
            });

            // Refresh cart to get updated data
            await refreshCart();
        } catch (err: any) {
            console.error('Failed to add to cart:', err);
            setError(err.message || 'Failed to add item to cart');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Remove item from cart
    const removeFromCart = async (artworkId: string) => {
        if (!token) {
            setError('Please log in');
            return;
        }

        const cartItemId = cartItemIds.get(artworkId);
        if (!cartItemId) {
            // Item not in cart or was added locally, remove from local state
            setCart(prev => prev.filter(item => item.id !== artworkId));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await cartApi.removeFromCart(cartItemId);
            await refreshCart();
        } catch (err: any) {
            console.error('Failed to remove from cart:', err);
            setError(err.message || 'Failed to remove item');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Update item quantity
    const updateQuantity = async (artworkId: string, quantity: number) => {
        if (!token) {
            setError('Please log in');
            return;
        }

        const cartItemId = cartItemIds.get(artworkId);
        if (!cartItemId) {
            setError('Item not found in cart');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await cartApi.updateCartItem(cartItemId, quantity);
            await refreshCart();
        } catch (err: any) {
            console.error('Failed to update quantity:', err);
            setError(err.message || 'Failed to update quantity');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Clear entire cart
    const clearCart = async () => {
        if (!token) {
            setCart([]);
            setCartItemIds(new Map());
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await cartApi.clearCart();
            setCart([]);
            setCartItemIds(new Map());
        } catch (err: any) {
            console.error('Failed to clear cart:', err);
            setError(err.message || 'Failed to clear cart');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                cartItemIds,
                isLoading,
                error,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                refreshCart,
                subtotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
