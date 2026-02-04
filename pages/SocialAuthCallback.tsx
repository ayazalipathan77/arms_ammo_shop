import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

export const SocialAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError('Social login failed. Please try again.');
            return;
        }

        if (token) {
            login(token);
            navigate('/', { replace: true });
        } else {
            setError('No authentication token received. Please try again.');
        }
    }, [searchParams, login, navigate]);

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
