import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Facebook, Twitter, Mail, Link as LinkIcon, Check, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ShareButtonsProps {
    url: string;
    title: string;
    description?: string;
    image?: string;
    className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
    url,
    title,
    description = '',
    image,
    className
}) => {
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? window.location.origin + url : url;

    // Copy link to clipboard
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    };

    // Native Web Share API (mobile)
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: description,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        }
    };

    // Social media share URLs
    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' - ' + shareUrl)}`,
        email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + shareUrl)}`,
        pinterest: image
            ? `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(title)}`
            : null,
    };

    const openShareWindow = (url: string) => {
        const width = 600;
        const height = 400;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(
            url,
            'share',
            `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0`
        );
    };

    return (
        <div className={cn("relative", className)}>
            {/* Share Button */}
            <button
                onClick={() => {
                    if (navigator.share) {
                        handleNativeShare();
                    } else {
                        setShowMenu(!showMenu);
                    }
                }}
                className="flex items-center gap-2 text-stone-400 hover:text-amber-500 transition-colors"
                aria-label="Share artwork"
            >
                <Share2 className="w-5 h-5" />
                <span className="text-sm uppercase tracking-widest font-mono hidden md:inline">Share</span>
            </button>

            {/* Share Menu Dropdown */}
            {showMenu && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full mt-2 right-0 bg-stone-900 border border-stone-800 rounded-lg shadow-2xl p-3 z-50 min-w-[200px]"
                    onMouseLeave={() => setShowMenu(false)}
                >
                    <p className="text-stone-500 text-xs uppercase tracking-widest mb-3 px-2">Share via</p>
                    <div className="space-y-1">
                        {/* Facebook */}
                        <button
                            onClick={() => {
                                openShareWindow(shareLinks.facebook);
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-stone-300 hover:bg-stone-800 rounded transition-colors"
                        >
                            <Facebook className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">Facebook</span>
                        </button>

                        {/* Twitter/X */}
                        <button
                            onClick={() => {
                                openShareWindow(shareLinks.twitter);
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-stone-300 hover:bg-stone-800 rounded transition-colors"
                        >
                            <Twitter className="w-4 h-4 text-sky-500" />
                            <span className="text-sm">Twitter</span>
                        </button>

                        {/* WhatsApp */}
                        <button
                            onClick={() => {
                                window.open(shareLinks.whatsapp, '_blank');
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-stone-300 hover:bg-stone-800 rounded transition-colors"
                        >
                            <MessageCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">WhatsApp</span>
                        </button>

                        {/* Email */}
                        <button
                            onClick={() => {
                                window.location.href = shareLinks.email;
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-stone-300 hover:bg-stone-800 rounded transition-colors"
                        >
                            <Mail className="w-4 h-4 text-stone-400" />
                            <span className="text-sm">Email</span>
                        </button>

                        {/* Copy Link */}
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-3 px-3 py-2 text-stone-300 hover:bg-stone-800 rounded transition-colors border-t border-stone-800 mt-1 pt-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-500">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <LinkIcon className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm">Copy Link</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ShareButtons;
