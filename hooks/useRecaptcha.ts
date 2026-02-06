import { useEffect, useState, useCallback, useRef } from 'react';

declare global {
    interface Window {
        grecaptcha: {
            ready: (callback: () => void) => void;
            execute: (siteKey: string, options: { action: string }) => Promise<string>;
        };
    }
}

interface RecaptchaConfig {
    siteKey: string | null;
    enabled: boolean;
}

// Use relative URL for production (same-origin) or localhost for development
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_URL = isLocalhost ? 'http://localhost:5000/api' : '/api';

export const useRecaptcha = () => {
    const [config, setConfig] = useState<RecaptchaConfig>({ siteKey: null, enabled: false });
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const scriptLoadedRef = useRef(false);

    // Fetch config from backend
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch(`${API_URL}/config`);
                const data = await response.json();
                setConfig({
                    siteKey: data.recaptchaSiteKey,
                    enabled: data.recaptchaEnabled
                });
            } catch (error) {
                console.error('Failed to fetch reCAPTCHA config:', error);
                setConfig({ siteKey: null, enabled: false });
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, []);

    // Load reCAPTCHA script
    useEffect(() => {
        if (!config.siteKey || !config.enabled || scriptLoadedRef.current) {
            return;
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="recaptcha"]');
        if (existingScript) {
            if (window.grecaptcha) {
                window.grecaptcha.ready(() => setIsLoaded(true));
            }
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${config.siteKey}`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            scriptLoadedRef.current = true;
            if (window.grecaptcha) {
                window.grecaptcha.ready(() => setIsLoaded(true));
            }
        };

        script.onerror = () => {
            console.error('Failed to load reCAPTCHA script');
        };

        document.head.appendChild(script);

        return () => {
            // Don't remove the script on unmount as it might be used by other components
        };
    }, [config.siteKey, config.enabled]);

    // Execute reCAPTCHA and get token
    const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
        // If reCAPTCHA is not enabled or configured, return null (backend will handle)
        if (!config.enabled || !config.siteKey) {
            console.log('[reCAPTCHA] Not configured, skipping token generation');
            return null;
        }

        // Wait for script to load if not ready
        if (!isLoaded || !window.grecaptcha) {
            console.warn('[reCAPTCHA] Script not loaded yet');
            return null;
        }

        try {
            const token = await window.grecaptcha.execute(config.siteKey, { action });
            return token;
        } catch (error) {
            console.error('[reCAPTCHA] Failed to execute:', error);
            return null;
        }
    }, [config.siteKey, config.enabled, isLoaded]);

    return {
        executeRecaptcha,
        isLoaded,
        isLoading,
        isEnabled: config.enabled
    };
};

// Export action constants for consistency with backend
export const RECAPTCHA_ACTIONS = {
    LOGIN: 'login',
    REGISTER: 'register',
    FORGOT_PASSWORD: 'forgot_password',
    CONTACT: 'contact'
} as const;
