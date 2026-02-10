import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Check, Mail, User, MessageSquare, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ParticleSystem from '../components/features/ParticleSystem';
import { cn, apiFetch } from '../lib/utils';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

export const GiftCards: React.FC = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState(5000);
    const [customAmount, setCustomAmount] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [message, setMessage] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const [purchasedCard, setPurchasedCard] = useState<any>(null);

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPurchasing(true);

        try {
            const finalAmount = customAmount ? parseFloat(customAmount) : amount;

            const token = localStorage.getItem('authToken');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await apiFetch('/api/giftcards/purchase', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    amount: finalAmount,
                    currency: 'PKR',
                    recipientEmail: recipientEmail || undefined,
                    recipientName: recipientName || undefined,
                    message: message || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to purchase gift card');
            }

            const data = await response.json();
            setPurchasedCard(data.giftCard);
            setPurchaseSuccess(true);

            // Auto-download voucher (if implemented)
            // window.print(); // Simple print option for now
        } catch (error) {
            console.error('Purchase error:', error);
            alert('Failed to purchase gift card. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    };

    if (purchaseSuccess && purchasedCard) {
        return (
            <div className="min-h-screen pt-32 pb-20 bg-void text-pearl px-6 relative overflow-hidden">
                <ParticleSystem />

                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8"
                    >
                        {/* Success Icon */}
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <Check className="w-12 h-12 text-green-500" />
                        </div>

                        <div>
                            <h1 className="font-display text-4xl md:text-5xl text-pearl mb-3">
                                Gift Card Purchased!
                            </h1>
                            <p className="text-warm-gray text-sm uppercase tracking-widest">
                                Your thoughtful gift is ready
                            </p>
                        </div>

                        {/* Gift Card Voucher */}
                        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-12 text-left mx-auto max-w-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-warm-gray mb-2">
                                        Muraqqa Art Gallery
                                    </p>
                                    <h2 className="font-display text-3xl text-amber-500">Gift Card</h2>
                                </div>
                                <Gift className="w-16 h-16 text-amber-500/50" />
                            </div>

                            <div className="bg-void/50 border border-pearl/10 rounded-lg p-6 mb-8">
                                <p className="text-xs uppercase tracking-widest text-warm-gray mb-2">
                                    Gift Card Code
                                </p>
                                <div className="font-mono text-2xl text-pearl tracking-wider mb-4 break-all">
                                    {purchasedCard.code}
                                </div>
                                <p className="text-xs text-warm-gray">
                                    Present this code at checkout to redeem
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-warm-gray mb-1">
                                        Amount
                                    </p>
                                    <p className="font-display text-2xl text-pearl">
                                        PKR {purchasedCard.amount.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-warm-gray mb-1">
                                        Expires
                                    </p>
                                    <p className="text-pearl">
                                        {new Date(purchasedCard.expiresAt).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {recipientEmail && (
                                <div className="border-t border-pearl/10 pt-6">
                                    <p className="text-xs text-warm-gray mb-2">
                                        Email sent to: <span className="text-pearl">{recipientEmail}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => window.print()}
                                className="border border-pearl/20 text-pearl px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
                            >
                                Print Voucher
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="bg-amber-500 text-void px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-amber-600 transition-all"
                            >
                                Back to Home
                            </button>
                        </div>

                        <p className="text-xs text-warm-gray">
                            A copy of this gift card has been saved to your account
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 bg-void text-pearl px-6 relative overflow-hidden">
            <ParticleSystem />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block mb-4"
                    >
                        <Gift className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    </motion.div>
                    <h1 className="font-display text-5xl md:text-6xl text-pearl mb-4">
                        Gift Cards
                    </h1>
                    <p className="text-warm-gray text-sm uppercase tracking-widest max-w-2xl mx-auto">
                        Give the gift of art. Perfect for collectors, enthusiasts, and anyone who appreciates beauty.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left: Purchase Form */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handlePurchase} className="space-y-8">
                            {/* Amount Selection */}
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-warm-gray mb-4">
                                    Select Amount
                                </label>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {PRESET_AMOUNTS.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => {
                                                setAmount(preset);
                                                setCustomAmount('');
                                            }}
                                            className={cn(
                                                "p-4 border-2 transition-all font-display text-lg",
                                                amount === preset && !customAmount
                                                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                                                    : "border-pearl/20 text-pearl hover:border-pearl/40"
                                            )}
                                        >
                                            PKR {preset.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-warm-gray mb-2">
                                        Or Enter Custom Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        placeholder="5000"
                                        min="500"
                                        max="1000000"
                                        className="w-full bg-charcoal border border-pearl/20 p-4 text-pearl font-mono focus:border-amber-500 focus:outline-none"
                                    />
                                    <p className="text-xs text-warm-gray mt-1">
                                        Min: PKR 500 • Max: PKR 1,000,000
                                    </p>
                                </div>
                            </div>

                            {/* Recipient Details (Optional) */}
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-warm-gray mb-4">
                                    Recipient Details <span className="text-warm-gray/50">(Optional)</span>
                                </label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
                                        <input
                                            type="text"
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                            placeholder="Recipient Name"
                                            className="w-full bg-charcoal border border-pearl/20 pl-12 pr-4 py-4 text-pearl focus:border-amber-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
                                        <input
                                            type="email"
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            placeholder="Recipient Email (we'll send them the voucher)"
                                            className="w-full bg-charcoal border border-pearl/20 pl-12 pr-4 py-4 text-pearl focus:border-amber-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Personal Message */}
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-warm-gray mb-2">
                                    Personal Message <span className="text-warm-gray/50">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-warm-gray" />
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        maxLength={500}
                                        placeholder="Add a personal message to your gift..."
                                        className="w-full bg-charcoal border border-pearl/20 pl-12 pr-4 py-4 text-pearl focus:border-amber-500 focus:outline-none min-h-[120px] resize-none"
                                    />
                                </div>
                                <p className="text-xs text-warm-gray mt-1 text-right">
                                    {message.length}/500
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isPurchasing || (!amount && !customAmount)}
                                className="w-full bg-amber-500 text-void py-4 font-bold uppercase tracking-widest text-sm hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isPurchasing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5" />
                                        Purchase Gift Card
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-warm-gray text-center">
                                Gift cards are delivered instantly and valid for 1 year from purchase date
                            </p>
                        </form>
                    </div>

                    {/* Right: Preview & Benefits */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Preview Card */}
                        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-8 sticky top-32">
                            <h3 className="font-display text-2xl text-pearl mb-6">Preview</h3>
                            <div className="bg-void/50 border border-pearl/10 rounded-lg p-6 mb-6">
                                <p className="text-xs uppercase tracking-widest text-warm-gray mb-2">
                                    Gift Card Value
                                </p>
                                <div className="font-display text-4xl text-amber-500">
                                    PKR {(customAmount ? parseFloat(customAmount) || 0 : amount).toLocaleString()}
                                </div>
                            </div>

                            {recipientName && (
                                <div className="mb-4">
                                    <p className="text-xs uppercase tracking-widest text-warm-gray mb-1">To:</p>
                                    <p className="text-pearl">{recipientName}</p>
                                </div>
                            )}

                            {message && (
                                <div className="bg-void/30 border border-pearl/10 rounded p-4 italic text-sm text-pearl/80">
                                    "{message}"
                                </div>
                            )}
                        </div>

                        {/* Benefits */}
                        <div className="space-y-4">
                            <h4 className="font-display text-xl text-pearl">Why Gift Art?</h4>
                            <ul className="space-y-3 text-sm text-warm-gray">
                                <li className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Support Pakistani contemporary artists</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Access to exclusive exhibitions and collections</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>No expiration worries - valid for 1 full year</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Instant delivery via email</span>
                                </li>
                                <li className="flex gap-3">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span>Beautiful printable voucher included</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GiftCards;
