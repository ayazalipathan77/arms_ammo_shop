import React, { useState, useEffect } from 'react';
import { useCart, useCurrency } from '../App';
import { useCartContext } from '../context/CartContext';
import { useGallery } from '../context/GalleryContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, CheckCircle, FileText, AlertCircle, Lock, Loader2 } from 'lucide-react';
import { orderApi, paymentApi } from '../services/api';
import { StripeCheckout } from '../components/StripeCheckout';

export const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { isLoading: cartLoading, error: cartError } = useCartContext();
  const { convertPrice } = useCurrency();
  const { addOrder, shippingConfig } = useGallery();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<'CART' | 'SHIPPING' | 'PAYMENT' | 'SUCCESS'>('CART');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Checkout Form State
  const [shippingDetails, setShippingDetails] = useState({
     firstName: '', lastName: '', address: '', city: '', country: 'Pakistan'
  });
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'BANK'>('STRIPE');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [whatsappNotify, setWhatsappNotify] = useState(false);

  // Payment Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Check for Stripe configuration and payment redirect
  useEffect(() => {
    const checkStripeConfig = async () => {
      try {
        const config = await paymentApi.getConfig();
        setStripeEnabled(config.enabled);
      } catch {
        setStripeEnabled(false);
      }
    };
    checkStripeConfig();

    // Check for payment success redirect
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      setStep('SUCCESS');
    }
  }, [searchParams]);

  // Totals Calculation
  const subtotalPKR = cart.reduce((sum, item) => sum + item.finalPrice, 0);

  // Dynamic Shipping from Config
  const shippingCostPKR = shippingDetails.country === 'Pakistan'
     ? shippingConfig.domesticRate
     : shippingConfig.internationalRate;

  // Tax: 5% Duty if International
  const taxPKR = shippingDetails.country !== 'Pakistan' ? subtotalPKR * 0.05 : 0;

  const totalPKR = subtotalPKR + shippingCostPKR + taxPKR - discountApplied;

  const handleApplyDiscount = () => {
     if (discountCode === 'MURAQQA10') {
        setDiscountApplied(subtotalPKR * 0.1);
     }
  };

  // Create order and proceed to payment
  const handleProceedToPayment = async () => {
    if (!token) {
      setPaymentError('Please log in to place an order');
      return;
    }

    if (!shippingDetails.firstName || !shippingDetails.address || !shippingDetails.city) {
      setPaymentError('Please fill in all shipping details');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      // Create order via API
      const orderItems = cart.map(item => ({
         artworkId: item.id,
         quantity: item.quantity || 1,
         type: (item.selectedPrintSize === 'ORIGINAL' ? 'ORIGINAL' : 'PRINT') as 'ORIGINAL' | 'PRINT',
         printSize: item.selectedPrintSize !== 'ORIGINAL' ? item.selectedPrintSize : undefined,
      }));

      const response = await orderApi.createOrder({
         items: orderItems,
         shippingAddress: shippingDetails.address,
         shippingCity: shippingDetails.city,
         shippingCountry: shippingDetails.country,
         paymentMethod: paymentMethod,
         currency: 'PKR',
      });

      // Also add to local state for invoice view compatibility
      const newOrder = {
         id: response.order.id,
         customerName: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
         customerEmail: user?.email || 'customer@example.com',
         items: [...cart],
         totalAmount: totalPKR,
         currency: 'PKR' as const,
         status: 'PENDING' as const,
         date: new Date(),
         shippingAddress: `${shippingDetails.address}, ${shippingDetails.city}`,
         shippingCountry: shippingDetails.country,
         trackingNumber: undefined,
         paymentMethod: paymentMethod,
         transactionId: undefined,
      };

      addOrder(newOrder);
      setCreatedOrderId(response.order.id);
      setPendingOrderId(response.order.id);

      if (paymentMethod === 'BANK') {
        // For bank transfer, go directly to success with pending status
        setStep('SUCCESS');
        await clearCart();
      } else {
        // For Stripe, show payment form
        setStep('PAYMENT');
      }
    } catch (error: any) {
      console.error('Order creation failed:', error);
      setPaymentError(error.message || 'Failed to create order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Stripe payment success
  const handlePaymentSuccess = async () => {
    setStep('SUCCESS');
    await clearCart();
  };

  // Handle Stripe payment error
  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  // Redirect to login if not authenticated and trying to checkout
  const handleProceedToShipping = () => {
     if (!token) {
        navigate('/auth');
        return;
     }
     setStep('SHIPPING');
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (cart.length === 0 && step !== 'SUCCESS') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-stone-500">
        <h2 className="text-3xl font-serif mb-4 text-stone-300">Your collection is empty</h2>
        {cartError && <p className="text-red-400 mb-4">{cartError}</p>}
        <Link to="/gallery" className="text-amber-500 hover:underline uppercase tracking-widest text-sm">Browse Artworks</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 max-w-6xl mx-auto px-4">

      {/* Stepper */}
      <div className="flex justify-center mb-12 text-xs uppercase tracking-widest">
         <div className={`px-4 border-b-2 pb-2 ${step === 'CART' ? 'border-amber-500 text-white' : 'border-stone-800 text-stone-600'}`}>1. Cart</div>
         <div className={`px-4 border-b-2 pb-2 ${step === 'SHIPPING' ? 'border-amber-500 text-white' : 'border-stone-800 text-stone-600'}`}>2. Details</div>
         <div className={`px-4 border-b-2 pb-2 ${step === 'PAYMENT' ? 'border-amber-500 text-white' : 'border-stone-800 text-stone-600'}`}>3. Payment</div>
         <div className={`px-4 border-b-2 pb-2 ${step === 'SUCCESS' ? 'border-amber-500 text-white' : 'border-stone-800 text-stone-600'}`}>4. Invoice</div>
      </div>

      {step === 'SUCCESS' ? (
         <div className="text-center max-w-lg mx-auto bg-stone-900 p-12 border border-stone-800 animate-fade-in">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            <h2 className="font-serif text-4xl text-white mb-2">
              {paymentMethod === 'BANK' ? 'Order Placed' : 'Order Confirmed'}
            </h2>
            <p className="text-stone-400 mb-8">
              {paymentMethod === 'BANK'
                ? 'Thank you for your order. Please complete the bank transfer to process your order.'
                : 'Thank you for collecting with Muraqqa. An invoice has been emailed to you.'}
            </p>
            {whatsappNotify && <p className="text-green-400 text-sm mb-8">You will receive WhatsApp updates.</p>}

            <Link
              to={createdOrderId ? `/invoice/${createdOrderId}` : '#'}
              target="_blank"
              className="flex items-center justify-center gap-2 mx-auto border border-stone-600 px-6 py-3 text-sm hover:bg-stone-800 text-white transition-colors"
            >
               <FileText size={16} /> View & Print Invoice
            </Link>

            <div className="mt-8 pt-8 border-t border-stone-800">
               <Link to="/gallery" className="text-amber-500 hover:underline text-sm">Continue Shopping</Link>
            </div>
         </div>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left Column: Form/Items */}
            <div className="lg:col-span-2 space-y-8">

               {step === 'CART' && (
                  <div className="space-y-6">
                     {cart.map((item, idx) => (
                     <div key={`${item.id}-${idx}`} className="flex gap-6 bg-stone-900/50 p-6 border border-stone-800 items-center">
                        <img src={item.imageUrl} alt={item.title} className="w-20 h-24 object-cover" />
                        <div className="flex-1">
                           <h3 className="text-xl text-white font-serif">{item.title}</h3>
                           <p className="text-amber-500 text-xs uppercase tracking-wider">{item.artistName}</p>
                           <p className="text-stone-500 text-xs mt-2">
                              {item.selectedPrintSize === 'ORIGINAL' ? 'Original Artwork' : `Print: ${item.selectedPrintSize?.replace('_', ' ')}`}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-white font-mono mb-2">{convertPrice(item.finalPrice)}</p>
                           <button onClick={() => removeFromCart(item.id)} className="text-stone-600 hover:text-red-500 transition-colors">
                           <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                     ))}
                  </div>
               )}

               {step === 'SHIPPING' && (
                  <div className="bg-stone-900 p-8 border border-stone-800 space-y-6 animate-fade-in">
                     <h3 className="font-serif text-2xl text-white mb-6">Shipping Address</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="First Name" value={shippingDetails.firstName} onChange={e => setShippingDetails({...shippingDetails, firstName: e.target.value})} className="bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                        <input type="text" placeholder="Last Name" value={shippingDetails.lastName} onChange={e => setShippingDetails({...shippingDetails, lastName: e.target.value})} className="bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                     </div>
                     <input type="text" placeholder="Address Line 1" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                     <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="City" value={shippingDetails.city} onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})} className="bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                        <select
                           value={shippingDetails.country}
                           onChange={(e) => setShippingDetails({...shippingDetails, country: e.target.value})}
                           className="bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none"
                        >
                           <option value="Pakistan">Pakistan</option>
                           <option value="USA">United States</option>
                           <option value="UK">United Kingdom</option>
                           <option value="UAE">UAE</option>
                        </select>
                     </div>

                     {/* Payment Method Selection */}
                     <div className="pt-6 border-t border-stone-800">
                        <h4 className="font-serif text-xl text-white mb-4">Payment Method</h4>
                        <div className="flex gap-4">
                           <button
                              onClick={() => setPaymentMethod('STRIPE')}
                              disabled={!stripeEnabled}
                              className={`flex-1 py-4 border text-center transition-colors ${
                                paymentMethod === 'STRIPE'
                                  ? 'border-amber-500 bg-amber-900/10 text-white'
                                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
                              } ${!stripeEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                              Card Payment (Stripe)
                              {!stripeEnabled && <span className="block text-xs mt-1">(Not configured)</span>}
                           </button>
                           <button
                              onClick={() => setPaymentMethod('BANK')}
                              className={`flex-1 py-4 border text-center transition-colors ${paymentMethod === 'BANK' ? 'border-amber-500 bg-amber-900/10 text-white' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
                           >
                              Direct Bank Transfer
                           </button>
                        </div>
                     </div>

                     <label className="flex items-center gap-2 text-stone-400 text-sm cursor-pointer mt-4">
                        <input
                           type="checkbox"
                           checked={whatsappNotify}
                           onChange={(e) => setWhatsappNotify(e.target.checked)}
                           className="w-4 h-4 accent-amber-500"
                        />
                        Get real-time order updates via WhatsApp
                     </label>

                     {paymentError && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-900/20 p-3 rounded border border-red-900/50">
                           <AlertCircle size={16} />
                           {paymentError}
                        </div>
                     )}
                  </div>
               )}

               {step === 'PAYMENT' && pendingOrderId && (
                  <div className="space-y-6 animate-fade-in">
                     <div className="bg-stone-900 p-8 border border-stone-800">
                        <h3 className="font-serif text-2xl text-white mb-6">Complete Payment</h3>

                        {paymentMethod === 'STRIPE' ? (
                           <div className="space-y-4">
                              <StripeCheckout
                                orderId={pendingOrderId}
                                amount={totalPKR}
                                currency="pkr"
                                onSuccess={handlePaymentSuccess}
                                onError={handlePaymentError}
                              />

                              <p className="text-[10px] text-stone-500 text-center flex items-center justify-center gap-1 mt-4">
                                 <Lock size={10}/> Payments are encrypted and secured by Stripe.
                              </p>
                           </div>
                        ) : (
                           <div className="bg-stone-950 p-6 border border-stone-700 text-sm text-stone-300 rounded">
                              <p className="font-bold text-white mb-2 text-lg">Meezan Bank</p>
                              <div className="space-y-1 font-mono text-xs text-stone-400">
                                 <p>Account Title: <span className="text-white">Muraqqa Gallery</span></p>
                                 <p>Account No:    <span className="text-white">PK00 MEZN 0000 0000 1234 5678</span></p>
                                 <p>Branch Code:   <span className="text-white">0201</span></p>
                              </div>
                              <p className="mt-4 italic text-stone-500 border-t border-stone-800 pt-3">
                                 Please upload proof of payment via email (orders@muraqqa.art) after checkout. Your order will be processed once funds are received.
                              </p>
                           </div>
                        )}

                        {paymentError && (
                           <div className="flex items-center gap-2 text-red-500 text-sm bg-red-900/20 p-3 rounded border border-red-900/50 mt-4">
                              <AlertCircle size={16} />
                              {paymentError}
                           </div>
                        )}
                     </div>
                  </div>
               )}
            </div>

            {/* Right Column: Summary */}
            <div className="lg:col-span-1">
               <div className="bg-stone-900 p-6 border border-stone-800 sticky top-24">
                  <h3 className="font-serif text-xl text-white mb-6">Order Summary</h3>

                  <div className="space-y-3 text-sm text-stone-400 border-b border-stone-800 pb-6 mb-6">
                     <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="text-white">{convertPrice(subtotalPKR)}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="flex items-center gap-1">Shipping {shippingDetails.country !== 'Pakistan' && '(DHL International)'}</span>
                        <span className="text-white">{convertPrice(shippingCostPKR)}</span>
                     </div>
                     <div className="flex justify-between">
                        <span>Tax / Duty {shippingDetails.country !== 'Pakistan' && '(5%)'}</span>
                        <span className="text-white">{convertPrice(taxPKR)}</span>
                     </div>
                     {discountApplied > 0 && (
                        <div className="flex justify-between text-green-500">
                           <span>Discount</span>
                           <span>- {convertPrice(discountApplied)}</span>
                        </div>
                     )}
                  </div>

                  {/* Promo Code */}
                  <div className="flex gap-2 mb-6">
                     <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="Discount Code"
                        className="flex-1 bg-stone-950 border border-stone-700 px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                     />
                     <button onClick={handleApplyDiscount} className="bg-stone-800 text-stone-300 px-4 py-2 text-xs hover:bg-stone-700">Apply</button>
                  </div>

                  <div className="flex justify-between text-xl font-serif text-white mb-6">
                     <span>Total</span>
                     <span>{convertPrice(totalPKR)}</span>
                  </div>

                  {step === 'CART' && (
                     <button
                        onClick={handleProceedToShipping}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 uppercase tracking-widest text-sm font-bold shadow-lg shadow-amber-900/20"
                     >
                        {token ? 'Proceed to Details' : 'Login to Checkout'}
                     </button>
                  )}
                  {step === 'SHIPPING' && (
                     <button
                        onClick={handleProceedToPayment}
                        disabled={isProcessing || !shippingDetails.firstName || !shippingDetails.address || !shippingDetails.city}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 uppercase tracking-widest text-sm font-bold disabled:opacity-50 shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2"
                     >
                        {isProcessing ? (
                           <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating Order...
                           </>
                        ) : (
                           `Continue to Payment`
                        )}
                     </button>
                  )}

                  {step !== 'CART' && step !== 'PAYMENT' && (
                     <button
                        onClick={() => setStep('CART')}
                        disabled={isProcessing}
                        className="w-full mt-2 text-stone-500 hover:text-stone-300 text-xs py-2 disabled:opacity-0 transition-opacity"
                     >
                        Back to Cart
                     </button>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
