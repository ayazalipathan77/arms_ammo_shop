
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import { useShop } from '../context/ShopContext';
import { ShieldCheck, Truck, Box, Share2, Heart, Maximize2, Target, Crosshair, ArrowLeft, Loader2, Info } from 'lucide-react';
import { Product } from '../types';
import { artworkApi, transformArtwork } from '../services/api'; // Using artworkApi for now
import { formatCurrency, cn } from '../lib/utils';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard'; // Use ProductCard
import { ReviewSection } from '../components/features/ReviewSection';
import { ShareButtons } from '../components/ui/ShareButtons';

export const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart } = useCartContext();
    const { products } = useShop();

    // Preserve shop URL with filters for "Back" navigation
    const backTo = (location.state as any)?.from?.startsWith('/shop')
        ? (location.state as any).from
        : '/shop';

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showZoom, setShowZoom] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // Fetch product from API
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            setIsLoading(true);
            setError(null);
            try {
                const response = await artworkApi.getById(id);
                const transformedProduct = transformArtwork(response.artwork);
                setProduct(transformedProduct);
            } catch (err) {
                console.error('Error fetching product:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch product');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
        window.scrollTo(0, 0);
    }, [id]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-void"><Loader2 className="w-8 h-8 text-tangerine animate-spin" /></div>;
    if (error || !product) return <div className="min-h-screen flex items-center justify-center bg-void text-pearl">{error || 'Product not found'}</div>;

    const relatedProducts = products.filter(p => p.id !== id && p.category === product.category).slice(0, 4);

    const handleAddToCart = () => {
        addToCart({
            ...product,
            quantity: quantity,
            finalPrice: product.price * quantity,
        });
        navigate('/cart');
    };

    return (
        <div className="min-h-screen bg-void pb-12">

            {/* Fullscreen Zoom Lightbox */}
            {showZoom && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center" onClick={() => setShowZoom(false)}>
                    <button
                        onClick={() => setShowZoom(false)}
                        className="absolute top-6 right-6 text-stone-400 hover:text-tangerine transition-colors z-10"
                    >
                        <Maximize2 size={28} />
                    </button>
                    <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="max-w-[95vw] max-h-[95vh] object-contain cursor-zoom-out"
                        onClick={(e) => { e.stopPropagation(); setShowZoom(false); }}
                    />
                </div>
            )}

            {/* Navigation Bar */}
            <div className="fixed top-24 left-0 w-full z-40 px-6 md:px-12 pointer-events-none">
                <Link to={backTo} className="inline-flex items-center gap-2 text-stone-400 hover:text-tangerine uppercase tracking-widest text-xs pointer-events-auto transition-colors bg-void/80 backdrop-blur-md border border-stone-800 px-4 py-2 rounded-sm font-bold">
                    <ArrowLeft size={14} /> Back to Shop
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen pt-20 lg:pt-24">

                {/* Left: Immersive Image */}
                <div className="lg:col-span-8 lg:h-screen lg:sticky lg:top-0 bg-charcoal/30 flex items-center justify-center p-8 md:p-20 relative group overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-void/0 via-void/0 to-void/50 z-10 pointer-events-none"></div>

                    <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center z-20">
                        <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="max-w-full max-h-full object-contain drop-shadow-2xl"
                        />
                        {/* Image Controls */}
                        <div className="absolute bottom-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <button onClick={() => setShowZoom(true)} className="bg-void/80 backdrop-blur text-stone-400 p-3 hover:text-tangerine transition-colors rounded-sm border border-stone-800" title="Zoom">
                                <Maximize2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Details Panel */}
                <div className="lg:col-span-4 bg-void px-8 md:px-12 py-10 lg:py-16 space-y-8 overflow-y-auto border-l border-stone-800 relative z-10">

                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <Link to={`/brands/${product.manufacturerId}`} className="text-tangerine uppercase tracking-[0.2em] text-xs font-bold hover:text-white transition-colors block mb-2 flex items-center gap-2">
                                <Target size={14} /> {product.manufacturerName}
                            </Link>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsSaved(!isSaved)}
                                    className={`transition-colors ${isSaved ? 'text-red-500' : 'text-stone-600 hover:text-red-500'}`}
                                >
                                    <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>
                        <h1 className="font-display text-3xl md:text-4xl text-pearl leading-tight uppercase">{product.title}</h1>
                        <div className="flex items-center gap-4 text-xs font-mono text-stone-500 uppercase tracking-widest">
                            <span>{product.category}</span>
                            {product.type === 'FIREARM' && <span className="w-1 h-1 bg-tangerine rounded-full"></span>}
                            {product.caliber && <span>{product.caliber}</span>}
                        </div>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-4 border-y border-stone-800 py-6">
                        {product.caliber && (
                            <div>
                                <span className="text-stone-600 text-[10px] uppercase tracking-widest block mb-1">Caliber</span>
                                <span className="text-pearl font-mono text-sm">{product.caliber}</span>
                            </div>
                        )}
                        {product.capacity && (
                            <div>
                                <span className="text-stone-600 text-[10px] uppercase tracking-widest block mb-1">Capacity</span>
                                <span className="text-pearl font-mono text-sm">{product.capacity}</span>
                            </div>
                        )}
                        {product.action && (
                            <div>
                                <span className="text-stone-600 text-[10px] uppercase tracking-widest block mb-1">Action</span>
                                <span className="text-pearl font-mono text-sm">{product.action}</span>
                            </div>
                        )}
                        {product.barrelLength && (
                            <div>
                                <span className="text-stone-600 text-[10px] uppercase tracking-widest block mb-1">Barrel Length</span>
                                <span className="text-pearl font-mono text-sm">{product.barrelLength}</span>
                            </div>
                        )}
                    </div>


                    {/* Description */}
                    <div className="prose prose-invert prose-stone">
                        <p className="font-light text-stone-300 leading-relaxed text-sm">{product.description}</p>
                    </div>

                    {/* Commerce Section */}
                    <div className="space-y-6 pt-8 border-t border-stone-800">

                        {/* Quantity Selector */}
                        <div className="space-y-2">
                            <span className="text-stone-500 text-xs uppercase tracking-widest font-bold">Quantity</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 border border-stone-700 text-stone-400 hover:border-tangerine hover:text-tangerine flex items-center justify-center transition-colors text-lg"
                                >
                                    −
                                </button>
                                <span className="text-pearl text-lg w-8 text-center font-mono">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 border border-stone-700 text-stone-400 hover:border-tangerine hover:text-tangerine flex items-center justify-center transition-colors text-lg"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Price & Add */}
                        <div className="flex flex-col gap-4">
                            <div>
                                <p className="font-display text-4xl text-pearl">{formatCurrency(product.price * quantity)}</p>
                                {quantity > 1 && (
                                    <p className="text-stone-500 text-xs mt-1 font-mono">{formatCurrency(product.price)} each</p>
                                )}
                            </div>
                            {product.inStock ? (
                                <Button
                                    onClick={handleAddToCart}
                                    variant="primary"
                                    className="w-full py-4 text-sm uppercase tracking-widest font-bold"
                                >
                                    Add to Cart
                                </Button>
                            ) : (
                                <button disabled className="w-full bg-charcoal text-stone-600 py-4 uppercase tracking-widest text-xs cursor-not-allowed border border-stone-800">
                                    Out of Stock
                                </button>
                            )}

                            <div className="flex items-center justify-center gap-4 mt-2">
                                <span className="flex items-center gap-2 text-[10px] text-stone-500 uppercase tracking-widest">
                                    <ShieldCheck size={12} className="text-tangerine" /> FFL Required
                                </span>
                                <span className="flex items-center gap-2 text-[10px] text-stone-500 uppercase tracking-widest">
                                    <Truck size={12} className="text-tangerine" /> Secure Shipping
                                </span>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* Reviews Section */}
            <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-16 border-t border-stone-800 mt-8">
                <ReviewSection artworkId={product.id} />
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-16 border-t border-stone-800 bg-void">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="text-tangerine text-xs uppercase tracking-[0.3em] mb-2 font-bold">Related</p>
                            <h3 className="font-display text-3xl text-pearl">Similar Items</h3>
                        </div>
                        <Link to="/shop" className="text-stone-500 hover:text-tangerine text-xs uppercase tracking-[0.2em] transition-colors hidden md:block font-bold">
                            View All →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {relatedProducts.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
