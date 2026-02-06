import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight, Clock, Star } from 'lucide-react';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? 'http://localhost:5000/api' : '/api';

type VerificationState = 'loading' | 'success' | 'error' | 'artist_pending';

export const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [state, setState] = useState<VerificationState>('loading');
    const [message, setMessage] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const token = searchParams.get('token');
    const userId = searchParams.get('id');

    useEffect(() => {
        if (!token || !userId) {
            setState('error');
            setMessage('Invalid verification link. Please check your email for the correct link.');
            return;
        }

        verifyEmail();
    }, [token, userId]);

    const verifyEmail = async () => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, token }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.requiresApproval) {
                    setState('artist_pending');
                    setMessage(data.message);
                } else {
                    setState('success');
                    setMessage(data.message);
                }
            } else {
                setState('error');
                setMessage(data.message || 'Verification failed');
            }
        } catch (error) {
            setState('error');
            setMessage('Failed to verify email. Please try again.');
        }
    };

    const handleResendVerification = async () => {
        const email = searchParams.get('email');
        if (!email) {
            setMessage('Email not provided. Please register again.');
            return;
        }

        setIsResending(true);
        try {
            const response = await fetch(`${API_URL}/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setResendSuccess(true);
                setMessage('A new verification email has been sent!');
            } else {
                const data = await response.json();
                setMessage(data.message || 'Failed to resend verification email');
            }
        } catch (error) {
            setMessage('Failed to resend verification email');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('/header_bg.jpg')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"></div>

            {/* Animated Orbs */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Header */}
                <motion.div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Star className="text-amber-500" size={24} />
                        <h1 className="font-serif text-4xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                            MURAQQA
                        </h1>
                        <span className="text-3xl text-amber-400" style={{ fontFamily: "var(--font-urdu)" }}>مرقع</span>
                        <Star className="text-amber-500" size={24} />
                    </div>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-stone-900/40 backdrop-blur-2xl border border-white/5 p-8 md:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl text-center"
                >
                    {state === 'loading' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-8"
                        >
                            <Loader2 className="w-16 h-16 text-amber-500 mx-auto animate-spin mb-6" />
                            <h2 className="text-white font-serif text-2xl mb-2">Verifying Your Email</h2>
                            <p className="text-stone-400">Please wait while we verify your email address...</p>
                        </motion.div>
                    )}

                    {state === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-8"
                        >
                            <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <h2 className="text-white font-serif text-2xl mb-2">Email Verified!</h2>
                            <p className="text-stone-400 mb-8">{message}</p>
                            <Link
                                to="/auth"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-lg hover:from-amber-400 hover:to-yellow-400 transition-all"
                            >
                                Continue to Login
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    )}

                    {state === 'artist_pending' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-8"
                        >
                            <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center">
                                <Clock className="w-12 h-12 text-amber-500" />
                            </div>
                            <h2 className="text-white font-serif text-2xl mb-2">Email Verified!</h2>
                            <p className="text-amber-400 font-medium mb-4">Artist Account Pending Approval</p>
                            <p className="text-stone-400 mb-6">
                                Your email has been verified successfully. Your artist account is now being reviewed by our team.
                            </p>
                            <div className="bg-stone-800/50 rounded-lg p-4 mb-6 text-left">
                                <p className="text-stone-300 text-sm">
                                    <strong className="text-amber-500">What happens next?</strong>
                                </p>
                                <ul className="text-stone-400 text-sm mt-2 space-y-1">
                                    <li>• Our team will review your application</li>
                                    <li>• You'll receive an email once approved</li>
                                    <li>• This usually takes 1-3 business days</li>
                                </ul>
                            </div>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 border border-amber-500 text-amber-500 px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-amber-500/10 transition-all"
                            >
                                Back to Home
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    )}

                    {state === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-8"
                        >
                            <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                                <XCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <h2 className="text-white font-serif text-2xl mb-2">Verification Failed</h2>
                            <p className="text-stone-400 mb-6">{message}</p>

                            {!resendSuccess && searchParams.get('email') && (
                                <button
                                    onClick={handleResendVerification}
                                    disabled={isResending}
                                    className="inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white px-6 py-3 rounded-lg transition-all mb-4 disabled:opacity-50"
                                >
                                    {isResending ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail size={16} />
                                            Resend Verification Email
                                        </>
                                    )}
                                </button>
                            )}

                            {resendSuccess && (
                                <p className="text-green-400 mb-4">New verification email sent! Check your inbox.</p>
                            )}

                            <div className="pt-4">
                                <Link
                                    to="/auth"
                                    className="text-amber-500 hover:text-amber-400 text-sm underline"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};
