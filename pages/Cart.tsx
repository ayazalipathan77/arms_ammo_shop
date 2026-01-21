import React, { useState } from 'react';
import { useCart, useCurrency } from '../App';
import { useCartContext } from '../context/CartContext';
import { useGallery } from '../context/GalleryContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, CheckCircle, CreditCard, FileText, AlertCircle, Lock, Loader2 } from 'lucide-react';
import { orderApi } from '../services/api';

export const Cart: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { isLoading: cartLoading, error: cartError } = useCartContext();
  const { convertPrice } = useCurrency();
  const { addOrder, shippingConfig } = useGallery();
  const { token, user } = useAuth();
  const navigate = useNavigate();

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

  // Card Inputs
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: ''
  });

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

  const handleCardInput = (field: keyof typeof cardDetails, value: string) => {
    let formatted = value;
    if (field === 'number') {
      formatted = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    } else if (field === 'expiry') {
      formatted = value.replace(/\D/g, '').slice(0, 4).replace(/(.{2})/, '$1/').slice(0, 5);
    } else if (field === 'cvc') {
      formatted = value.replace(/\D/g, '').slice(0, 3);
    }
    setCardDetails(prev => ({ ...prev, [field]: formatted }));
    setPaymentError('');
  };

  const validateCard = () => {
    if (paymentMethod === 'BANK') return null;

    // Simple mock validation
    const rawNum = cardDetails.number.replace(/\s/g, '');
    if (rawNum.length < 16) return 'Invalid card number length.';
    if (cardDetails.expiry.length < 5) return 'Invalid expiry date.';
    if (cardDetails.cvc.length < 3) return 'Invalid CVC.';

    // Simulate error for specific test card
    if (rawNum.endsWith('0000')) return 'Your card was declined.';

    return null;
  };

  const handlePlaceOrder = async () => {
     const validationError = validateCard();
     if (validationError) {
       setPaymentError(validationError);
       return;
     }

     if (!token) {
       setPaymentError('Please log in to place an order');
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
        setStep('SUCCESS');
        // Cart is automatically cleared by the API
        await clearCart();
     } catch (error: any) {
        console.error('Order creation failed:', error);
        setPaymentError(error.message || 'Failed to create order. Please try again.');
     } finally {
        setIsProcessing(false);
     }
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
            <h2 className="font-serif text-4xl text-white mb-2">Order Confirmed</h2>
            <p className="text-stone-400 mb-8">Thank you for collecting with Muraqqa. An invoice has been emailed to you.</p>
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
                     <label className="flex items-center gap-2 text-stone-400 text-sm cursor-pointer mt-4">
                        <input
                           type="checkbox"
                           checked={whatsappNotify}
                           onChange={(e) => setWhatsappNotify(e.target.checked)}
                           className="w-4 h-4 accent-amber-500"
                        />
                        Get real-time order updates via WhatsApp
                     </label>
                  </div>
               )}

               {step === 'PAYMENT' && (
                  <div className="space-y-6 animate-fade-in">
                     <div className="bg-stone-900 p-8 border border-stone-800">
                        <h3 className="font-serif text-2xl text-white mb-6">Payment Method</h3>
                        <div className="flex gap-4 mb-6">
                           <button
                              onClick={() => { setPaymentMethod('STRIPE'); setPaymentError(''); }}
                              className={`flex-1 py-4 border text-center transition-colors ${paymentMethod === 'STRIPE' ? 'border-amber-500 bg-amber-900/10 text-white' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
                           >
                              Card Payment (Stripe)
                           </button>
                           <button
                              onClick={() => { setPaymentMethod('BANK'); setPaymentError(''); }}
                              className={`flex-1 py-4 border text-center transition-colors ${paymentMethod === 'BANK' ? 'border-amber-500 bg-amber-900/10 text-white' : 'border-stone-700 text-stone-400 hover:border-stone-500'}`}
                           >
                              Direct Bank Transfer
                           </button>
                        </div>

                        {paymentMethod === 'STRIPE' ? (
                           <div className="space-y-4 animate-fade-in relative">
                              {isProcessing && (
                                 <div className="absolute inset-0 z-10 bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                    <span className="text-amber-500 text-sm font-bold uppercase tracking-widest">Processing Payment...</span>
                                 </div>
                              )}

                              <div className="bg-stone-950 border border-stone-700 p-6 rounded flex flex-col gap-5">
                                 <div className="flex justify-between items-center">
                                    <label className="text-xs text-stone-500 uppercase tracking-widest">Card Details</label>
                                    <div className="flex gap-2 opacity-50">
                                        <div className="w-8 h-5 bg-stone-700 rounded"></div>
                                        <div className="w-8 h-5 bg-stone-700 rounded"></div>
                                    </div>
                                 </div>

                                 <div className="space-y-4">
                                    <div className="relative group">
                                       <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={20} />
                                       <input
                                          type="text"
                                          value={cardDetails.number}
                                          onChange={(e) => handleCardInput('number', e.target.value)}
                                          placeholder="0000 0000 0000 0000"
                                          maxLength={19}
                                          className="w-full bg-stone-900 border border-stone-700 rounded p-3 pl-10 text-white font-mono placeholder:text-stone-700 focus:border-amber-500 outline-none transition-colors"
                                       />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <input
                                          type="text"
                                          value={cardDetails.expiry}
                                          onChange={(e) => handleCardInput('expiry', e.target.value)}
                                          placeholder="MM/YY"
                                          maxLength={5}
                                          className="bg-stone-900 border border-stone-700 rounded p-3 text-center text-white font-mono placeholder:text-stone-700 focus:border-amber-500 outline-none transition-colors"
                                       />
                                       <div className="relative group">
                                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                                          <input
                                             type="text"
                                             value={cardDetails.cvc}
                                             onChange={(e) => handleCardInput('cvc', e.target.value)}
                                             placeholder="CVC"
                                             maxLength={3}
                                             className="w-full bg-stone-900 border border-stone-700 rounded p-3 text-center text-white font-mono placeholder:text-stone-700 focus:border-amber-500 outline-none transition-colors"
                                          />
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {paymentError && (
                                 <div className="flex items-center gap-2 text-red-500 text-sm bg-red-900/20 p-3 rounded border border-red-900/50 animate-pulse">
                                    <AlertCircle size={16} />
                                    {paymentError}
                                 </div>
                              )}

                              <p className="text-[10px] text-stone-500 text-center flex items-center justify-center gap-1 mt-2">
                                 <Lock size={10}/> Payments are encrypted and secured by Stripe.
                              </p>
                           </div>
                        ) : (
                           <div className="bg-stone-950 p-6 border border-stone-700 text-sm text-stone-300 rounded animate-fade-in">
                              <p className="font-bold text-white mb-2 text-lg">Meezan Bank</p>
                              <div className="space-y-1 font-mono text-xs text-stone-400">
                                 <p>Account Title: <span className="text-white">Muraqqa Gallery</span></p>
                                 <p>Account No:    <span className="text-white">PK00 MEZN 0000 0000 1234 5678</span></p>
                                 <p>Branch Code:   <span className="text-white">0201</span></p>
                              </div>
                              <p className="mt-4 italic text-stone-500 border-t border-stone-800 pt-3">
                                 Please upload proof of payment via email (orders@muraqqa.art) after checkout. Your order will be processed once funds are received.
                              </p>

                              {paymentError && (
                                 <div className="flex items-center gap-2 text-red-500 text-sm bg-red-900/20 p-3 rounded border border-red-900/50 mt-4">
                                    <AlertCircle size={16} />
                                    {paymentError}
                                 </div>
                              )}
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
                        onClick={() => {
                           if(shippingDetails.firstName && shippingDetails.address) setStep('PAYMENT');
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 uppercase tracking-widest text-sm font-bold disabled:opacity-50 shadow-lg shadow-amber-900/20 transition-all"
                        disabled={!shippingDetails.firstName || !shippingDetails.address}
                     >
                        Continue to Payment
                     </button>
                  )}
                  {step === 'PAYMENT' && (
                     <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="w-full bg-white hover:bg-stone-200 text-black py-3 uppercase tracking-widest text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                     >
                        {isProcessing ? (
                           <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                           </>
                        ) : (
                           `Pay ${convertPrice(totalPKR)}`
                        )}
                     </button>
                  )}

                  {step !== 'CART' && (
                     <button onClick={() => setStep('CART')} disabled={isProcessing} className="w-full mt-2 text-stone-500 hover:text-stone-300 text-xs py-2 disabled:opacity-0 transition-opacity">
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
