import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../config/database';
import {
    addToCartSchema,
    updateCartItemSchema,
} from '../validators/cart.validator';

// Get user's cart
export const getCart = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const cartItems = await prisma.cartItem.findMany({
            where: { userId: req.user.userId },
            include: {
                artwork: {
                    include: {
                        artist: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => {
            return sum + Number(item.artwork.price) * item.quantity;
        }, 0);

        res.status(StatusCodes.OK).json({
            cartItems,
            summary: {
                itemCount: cartItems.length,
                totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
                subtotal,
            },
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to fetch cart',
        });
    }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const validatedData = addToCartSchema.parse(req.body);

        // Check if artwork exists and is in stock
        const artwork = await prisma.artwork.findUnique({
            where: { id: validatedData.artworkId },
        });

        if (!artwork) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Artwork not found' });
            return;
        }

        if (!artwork.inStock) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: 'Artwork is out of stock' });
            return;
        }

        // Check if item already in cart (same artwork, type, and print size)
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                userId: req.user.userId,
                artworkId: validatedData.artworkId,
                type: validatedData.type,
                printSize: validatedData.printSize || null,
            },
        });

        let cartItem;

        if (existingItem) {
            // Update quantity
            cartItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + validatedData.quantity,
                },
                include: {
                    artwork: {
                        include: {
                            artist: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        } else {
            // Create new cart item
            cartItem = await prisma.cartItem.create({
                data: {
                    userId: req.user.userId,
                    artworkId: validatedData.artworkId,
                    quantity: validatedData.quantity,
                    type: validatedData.type,
                    printSize: validatedData.printSize,
                },
                include: {
                    artwork: {
                        include: {
                            artist: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        res.status(StatusCodes.CREATED).json({
            message: 'Item added to cart',
            cartItem,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Add to cart error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to add item to cart',
        });
    }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const itemId = req.params.itemId as string;
        const validatedData = updateCartItemSchema.parse(req.body);

        // Check if cart item exists and belongs to user
        const existingItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
        });

        if (!existingItem) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Cart item not found' });
            return;
        }

        if (existingItem.userId !== req.user.userId) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Cannot modify another user\'s cart' });
            return;
        }

        const cartItem = await prisma.cartItem.update({
            where: { id: itemId },
            data: {
                quantity: validatedData.quantity,
            },
            include: {
                artwork: {
                    include: {
                        artist: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        res.status(StatusCodes.OK).json({
            message: 'Cart item updated',
            cartItem,
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Validation error',
                errors: error.errors,
            });
            return;
        }
        console.error('Update cart item error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to update cart item',
        });
    }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        const itemId = req.params.itemId as string;

        // Check if cart item exists and belongs to user
        const existingItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
        });

        if (!existingItem) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'Cart item not found' });
            return;
        }

        if (existingItem.userId !== req.user.userId) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Cannot modify another user\'s cart' });
            return;
        }

        await prisma.cartItem.delete({
            where: { id: itemId },
        });

        res.status(StatusCodes.OK).json({
            message: 'Item removed from cart',
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to remove item from cart',
        });
    }
};

// Clear entire cart
export const clearCart = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Not authenticated' });
            return;
        }

        await prisma.cartItem.deleteMany({
            where: { userId: req.user.userId },
        });

        res.status(StatusCodes.OK).json({
            message: 'Cart cleared',
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to clear cart',
        });
    }
};
