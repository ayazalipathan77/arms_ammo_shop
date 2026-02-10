import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

        const errorParam = searchParams.get('error');

        console.log('🔐 OAuth Callback:');
        console.log('  - Error param:', errorParam);

        if (errorParam) {
            console.error('❌ OAuth error:', errorParam);
            setError('Social login failed. Please try again.');
            return;
        }

        // SECURITY FIX: Fetch token from secure endpoint instead of URL
        // This prevents token exposure in browser history and referer headers
        const fetchToken = async () => {
            try {
                console.log('🔐 Fetching token from secure endpoint...');
                const response = await fetch(`${API_URL}/auth/social-token`, {
                    method: 'GET',
                    credentials: 'include', // Important: includes cookies
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to retrieve authentication token');
                }

                const data = await response.json();
                const token = data.token;

                if (token) {
                    console.log('✅ Token retrieved securely, processing login...');
                    
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
                } else {
                    throw new Error('No token received from server');
                }
            } catch (err: any) {
                console.error('❌ Error during token retrieval:', err);
                setError(err.message || 'Login failed. Please try again.');
            }
        };

        fetchToken();
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
