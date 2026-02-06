import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

export const SocialAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const hasProcessed = useRef(false);

    console.log('🔄 SocialAuthCallback component rendered');

    useEffect(() => {
        console.log('🔄 useEffect running, hasProcessed:', hasProcessed.current);

        // Prevent multiple executions using ref
        if (hasProcessed.current) {
            console.log('⏭️ Already processed, skipping');
            return;
        }
        hasProcessed.current = true;

        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');
        const fullUrl = window.location.href;

        console.log('🔐 OAuth Callback:');
        console.log('  - Full URL:', fullUrl);
        console.log('  - Token:', token ? `${token.substring(0, 20)}...` : 'Missing');
        console.log('  - Error param:', errorParam);

        if (errorParam) {
            console.error('❌ OAuth error:', errorParam);
            setError('Social login failed. Please try again.');
            return;
        }

        if (token) {
            console.log('✅ Token found, processing login...');

            try {
                // Set token in auth context
                login(token);
                console.log('✅ Token set successfully in AuthContext');
                console.log('✅ localStorage authToken:', localStorage.getItem('authToken') ? 'Set' : 'Not set');

                // Small delay to ensure state updates
                setTimeout(() => {
                    console.log('🚀 Navigating to home page...');
                    navigate('/', { replace: true });
                    console.log('✅ Navigate called');
                }, 100);
            } catch (err) {
                console.error('❌ Error during login:', err);
                setError('Login failed. Please try again.');
            }
        } else {
            console.error('❌ No token in URL parameters');
            setError('No authentication token received. Please try again.');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run once on mount

    if (error) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center px-4">
                <div className="bg-stone-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-2xl text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-white font-serif text-xl mb-2">Authentication Failed</h2>
                    <p className="text-stone-400 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/auth', { replace: true })}
                        className="inline-flex items-center gap-2 border border-amber-500 text-amber-500 px-8 py-3 font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-amber-500/10 transition-all"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center px-4">
            <div className="text-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
                <p className="text-stone-400 text-sm uppercase tracking-widest">Signing you in...</p>
            </div>
        </div>
    );
};
