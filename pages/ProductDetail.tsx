import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import { useShop } from '../context/ShopContext';
import { ShieldCheck, Truck, Share2, Heart, Maximize2, Target, ArrowLeft, Loader2, Minus, Plus, Info } from 'lucide-react';
import { Product } from '../types';
import { artworkApi, transformArtwork } from '../services/api';
import { formatCurrency, cn } from '../lib/utils';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import { ReviewSection } from '../components/features/ReviewSection';

export const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart } = useCartContext();
    const { products } = useShop();

    // Preserve shop URL with filters
    const backTo = (location.state as any)?.from?.startsWith('/shop')
        ? (location.state as any).from
        : '/shop';

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeImage, setActiveImage] = useState<string>('');
    const [showZoom, setShowZoom] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // Fetch product
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            setIsLoading(true);
            setError(null);
            try {
                const response = await artworkApi.getById(id);
                const transformedProduct = transformArtwork(response.artwork);
                setProduct(transformedProduct);
                setActiveImage(transformedProduct.imageUrl);
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

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-void"><Loader2 className="w-8 h-8 text-safety animate-spin" /></div>;
    if (error || !product) return <div className="min-h-screen flex items-center justify-center bg-void text-pearl">{error || 'Product not found'}</div>;

    const relatedProducts = products.filter(p => p.id !== id && p.category === product.category).slice(0, 4);

    // Mock multiple images if none exist (for demo purposes as requested)
    const galleryImages = [
        product.imageUrl,
        ...(product.additionalImages || []),
        // If no additional images, duplicate main image to show gallery functionality if needed,
        // but cleaner to just show what we have. For this demo, I'll allow duplication if array is empty to show the UI.
        ...(product.additionalImages?.length ? [] : [product.imageUrl, product.imageUrl])
    ].slice(0, 4);

    const handleAddToCart = () => {
        addToCart({
            ...product,
            quantity: quantity,
            finalPrice: product.price * quantity,
        });
        navigate('/cart');
    };

    return (
        <div className="min-h-screen bg-void pb-12 font-sans">

            {/* Fullscreen Zoom */}
            {showZoom && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center" onClick={() => setShowZoom(false)}>
                    <button className="absolute top-6 right-6 text-stone-400 hover:text-safety transition-colors z-10">
                        <Maximize2 size={32} />
                    </button>
                    <img
                        src={activeImage}
                        alt={product.title}
                        className="max-w-[95vw] max-h-[95vh] object-contain cursor-zoom-out"
                    />
                </div>
            )}

            {/* Sticky Nav */}
            <div className="fixed top-24 left-0 w-full z-40 px-6 md:px-12 pointer-events-none">
                <Link to={backTo} className="inline-flex items-center gap-2 text-camo hover:text-safety uppercase tracking-widest text-[10px] pointer-events-auto transition-colors bg-void/90 backdrop-blur border border-gunmetal px-4 py-2 font-bold font-display">
                    <ArrowLeft size={12} /> Return to Base
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen pt-20 lg:pt-0">

                {/* LEFT: Gallery Section */}
                <div className="lg:col-span-8 bg-black/40 flex flex-col relative group">
                    {/* Main Image Stage */}
                    <div className="flex-1 flex items-center justify-center p-8 md:p-20 relative min-h-[50vh] lg:min-h-screen">
                        {/* Camo Pattern Overlay (Subtle) */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                        <div className="relative w-full h-full flex items-center justify-center z-10 transition-all duration-300">
                            <img
                                src={activeImage}
                                alt={product.title}
                                className="max-w-full max-h-[70vh] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Zoom Trigger */}
                        <button
                            onClick={() => setShowZoom(true)}
                            className="absolute bottom-8 right-8 bg-gunmetal/80 text-camo p-3 hover:text-safety hover:bg-void border border-stone-800 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Maximize2 size={20} />
                        </button>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="lg:absolute bottom-0 left-0 w-full p-6 flex justify-center gap-4 z-20 bg-gradient-to-t from-void via-void/80 to-transparent lg:pb-8">
                        {galleryImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={cn(
                                    "w-16 h-16 md:w-20 md:h-20 border-2 transition-all p-1 bg-void",
                                    activeImage === img ? "border-safety" : "border-stone-700 hover:border-camo"
                                )}
                            >
                                <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Tech Specs Dossier */}
                <div className="lg:col-span-4 bg-void border-l border-gunmetal flex flex-col h-full lg:min-h-screen relative z-10">
                    <div className="p-8 md:p-12 space-y-8 overflow-y-auto custom-scrollbar flex-1">

                        {/* Header */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-start border-b border-gunmetal pb-4">
                                <Link to={`/brands/${product.manufacturerId}`} className="text-safety font-display text-sm tracking-widest uppercase hover:underline flex items-center gap-2">
                                    <Target size={16} /> {product.manufacturerName}
                                </Link>
                                <button onClick={() => setIsSaved(!isSaved)} className={cn("transition-colors", isSaved ? "text-alert" : "text-camo hover:text-alert")}>
                                    <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                                </button>
                            </div>

                            <div>
                                <h1 className="font-display text-4xl md:text-5xl text-pearl uppercase leading-none mb-2">{product.title}</h1>
                                <div className="flex gap-3 text-[10px] font-mono text-camo uppercase tracking-widest">
                                    <span className="bg-gunmetal px-2 py-1 rounded-sm">Cat: {product.category}</span>
                                    {product.year && <span className="bg-gunmetal px-2 py-1 rounded-sm">Mfr: {product.year}</span>}
                                    <span className={cn("px-2 py-1 rounded-sm", product.inStock ? "bg-olive/20 text-olive" : "bg-alert/20 text-alert")}>
                                        {product.inStock ? "In Stock" : "Out of Stock"}
                                    </span>
                                </div>
                            </div>

                            <div className="font-display text-3xl text-brass tracking-wide">
                                {formatCurrency(product.price)}
                            </div>
                        </div>

                        {/* Tech Specs Table */}
                        <div className="bg-gunmetal/30 border border-gunmetal p-6 rounded-sm">
                            <h3 className="font-display text-camo text-sm uppercase tracking-widest mb-4 border-b border-stone-800 pb-2">Technical Specifications</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 font-mono text-xs">
                                {product.caliber && (
                                    <div className="flex flex-col">
                                        <span className="text-stone-500 uppercase text-[10px]">Caliber</span>
                                        <span className="text-pearl text-sm">{product.caliber}</span>
                                    </div>
                                )}
                                {product.action && (
                                    <div className="flex flex-col">
                                        <span className="text-stone-500 uppercase text-[10px]">Action</span>
                                        <span className="text-pearl text-sm">{product.action}</span>
                                    </div>
                                )}
                                {product.capacity && (
                                    <div className="flex flex-col">
                                        <span className="text-stone-500 uppercase text-[10px]">Capacity</span>
                                        <span className="text-pearl text-sm">{product.capacity}</span>
                                    </div>
                                )}
                                {product.barrelLength && (
                                    <div className="flex flex-col">
                                        <span className="text-stone-500 uppercase text-[10px]">Barrel</span>
                                        <span className="text-pearl text-sm">{product.barrelLength}</span>
                                    </div>
                                )}
                                {product.weight && (
                                    <div className="flex flex-col">
                                        <span className="text-stone-500 uppercase text-[10px]">Weight</span>
                                        <span className="text-pearl text-sm">{product.weight}</span>
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-stone-500 uppercase text-[10px]">Item ID</span>
                                    <span className="text-pearl text-sm">#{product.id.substring(0, 6).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="font-display text-camo text-sm uppercase tracking-widest mb-2">Description</h3>
                            <p className="text-stone-400 font-light leading-relaxed text-sm font-sans border-l-2 border-gunmetal pl-4">
                                {product.description}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 space-y-4">
                            <div className="flex items-center justify-between bg-gunmetal/20 p-4 border border-gunmetal">
                                <span className="font-display text-sm text-camo uppercase">Quantity</span>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-stone-400 hover:text-safety"><Minus size={18} /></button>
                                    <span className="font-mono text-xl text-pearl w-8 text-center">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="text-stone-400 hover:text-safety"><Plus size={18} /></button>
                                </div>
                            </div>

                            <Button
                                onClick={handleAddToCart}
                                disabled={!product.inStock}
                                variant="primary"
                                className="w-full h-14 text-sm font-display tracking-[0.2em] clip-diagonal"
                            >
                                {product.inStock ? 'Acquire Equipment' : 'Unit Unavailable'}
                            </Button>

                            <div className="flex justify-center gap-6 pt-2">
                                <span className="flex items-center gap-2 text-[10px] text-camo uppercase tracking-widest font-mono">
                                    <ShieldCheck size={12} className="text-safety" /> FFL Required
                                </span>
                                <span className="flex items-center gap-2 text-[10px] text-camo uppercase tracking-widest font-mono">
                                    <Truck size={12} className="text-safety" /> Secure Transit
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews & Related */}
            <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-20 border-t border-gunmetal">
                <ReviewSection artworkId={product.id} />

                {relatedProducts.length > 0 && (
                    <div className="mt-20">
                        <div className="flex items-end justify-between mb-8 border-b border-gunmetal pb-4">
                            <div>
                                <p className="text-safety text-xs font-display tracking-widest mb-1">Related Gear</p>
                                <h3 className="font-display text-3xl text-pearl">You Might Also Need</h3>
                            </div>
                            <Link to="/shop" className="text-camo hover:text-safety text-xs font-display tracking-widest uppercase mb-2">
                                View Full Catalog →
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
