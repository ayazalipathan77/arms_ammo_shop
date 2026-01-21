import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { paymentApi } from '../services/api';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface StripeCheckoutProps {
    orderId: string;
    amount: number; // Amount in PKR
    currency?: 'pkr' | 'usd' | 'gbp';
    onSuccess: () => void;
    onError: (error: string) => void;
}

// Separate component for the payment form that uses Stripe hooks
const CheckoutForm: React.FC<{
    onSuccess: () => void;
    onError: (error: string) => void;
}> = ({ onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/#/cart?payment=success`,
            },
            redirect: 'if_required',
        });

        if (error) {
            setMessage(error.message || 'Payment failed');
            onError(error.message || 'Payment failed');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            setMessage('Payment successful!');
            onSuccess();
        } else {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement
                options={{
                    layout: 'tabs',
                }}
            />

            {message && (
                <div className={`flex items-center gap-2 p-3 rounded text-sm ${
                    message.includes('successful')
                        ? 'bg-green-900/20 text-green-400 border border-green-900/50'
                        : 'bg-red-900/20 text-red-400 border border-red-900/50'
                }`}>
                    {message.includes('successful') ? (
                        <CheckCircle size={16} />
                    ) : (
                        <AlertCircle size={16} />
                    )}
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-white hover:bg-stone-200 text-black py-3 uppercase tracking-widest text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    'Complete Payment'
                )}
            </button>
        </form>
    );
};

// Main component that loads Stripe and creates the payment intent
export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
    orderId,
    amount,
    currency = 'pkr',
    onSuccess,
    onError,
}) => {
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load Stripe configuration and create payment intent
        const initializePayment = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Get Stripe publishable key
                const config = await paymentApi.getConfig();

                if (!config.enabled || !config.publishableKey) {
                    setError('Stripe payment is not available. Please use bank transfer.');
                    return;
                }

                // Load Stripe
                setStripePromise(loadStripe(config.publishableKey));

                // Create payment intent
                const intentResponse = await paymentApi.createPaymentIntent({
                    orderId,
                    currency,
                });

                setClientSecret(intentResponse.clientSecret);
            } catch (err: any) {
                console.error('Failed to initialize payment:', err);
                setError(err.message || 'Failed to initialize payment');
                onError(err.message || 'Failed to initialize payment');
            } finally {
                setIsLoading(false);
            }
        };

        initializePayment();
    }, [orderId, currency, onError]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
                <p className="text-stone-400">Initializing secure payment...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-900/20 p-4 rounded border border-red-900/50">
                <AlertCircle size={16} />
                <div>
                    <p className="font-medium">Payment Error</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!clientSecret || !stripePromise) {
        return (
            <div className="text-stone-400 text-center py-8">
                Unable to load payment form. Please try again.
            </div>
        );
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: {
                    theme: 'night',
                    variables: {
                        colorPrimary: '#f59e0b',
                        colorBackground: '#0c0a09',
                        colorText: '#e7e5e4',
                        colorDanger: '#ef4444',
                        fontFamily: 'system-ui, sans-serif',
                        borderRadius: '4px',
                    },
                },
            }}
        >
            <CheckoutForm onSuccess={onSuccess} onError={onError} />
        </Elements>
    );
};

export default StripeCheckout;
