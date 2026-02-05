import React, { useState, useEffect } from 'react';
import { useCartContext } from '../context/CartContext';
import { useGallery } from '../context/GalleryContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, CheckCircle, FileText, AlertCircle, Lock, Loader2, ArrowRight } from 'lucide-react';
import { orderApi, paymentApi, shippingApi, userApi } from '../services/api';
import { StripeCheckout } from '../components/StripeCheckout';
import { formatCurrency, cn } from '../lib/utils';
import ParticleSystem from '../components/features/ParticleSystem';

export const Cart: React.FC = () => {
   const { cart, removeFromCart, clearCart, isLoading: cartLoading, error: cartError } = useCartContext();
   const { addOrder } = useGallery();
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

   // Shipping Rates State
   const [shippingRates, setShippingRates] = useState<any[]>([]);
   const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
   const [loadingRates, setLoadingRates] = useState(false);

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

   // Fetch shipping rates when country changes
   useEffect(() => {
      const fetchRates = async () => {
         setLoadingRates(true);
         try {
            const { rates } = await shippingApi.getRates({ country: shippingDetails.country, items: cart });
            setShippingRates(rates);
            // Default select the first rate
            if (rates.length > 0) setSelectedRateId(rates[0].id);
         } catch (error) {
            console.error('Failed to fetch shipping rates:', error);
         } finally {
            setLoadingRates(false);
         }
      };
      if (step === 'SHIPPING' || step === 'CART') {
         fetchRates();
      }
   }, [shippingDetails.country, cart, step]);

   // Pre-fill shipping details from user profile
   useEffect(() => {
      const loadUserProfile = async () => {
         if (step === 'SHIPPING' && token && !shippingDetails.address) {
            try {
               const { user: profile } = await userApi.getProfile();
               if (profile) {
                  const defaultAddress = profile.addresses?.find((a: any) => a.isDefault) || profile.addresses?.[0];

                  setShippingDetails(prev => ({
                     ...prev,
                     firstName: profile.fullName?.split(' ')[0] || prev.firstName,
                     lastName: profile.fullName?.split(' ').slice(1).join(' ') || prev.lastName,
                     address: defaultAddress?.address || prev.address,
                     city: defaultAddress?.city || prev.city,
                     country: defaultAddress?.country || prev.country,
                  }));
               }
            } catch (err) {
               console.error('Failed to load profile for shipping:', err);
            }
         }
      };
      loadUserProfile();
   }, [step, token]);


   // Totals Calculation
   const subtotalPKR = cart.reduce((sum, item) => sum + item.finalPrice, 0);

   // Dynamic Shipping from Selected Rate
   const selectedRate = shippingRates.find(r => r.id === selectedRateId);
   const shippingCostPKR = selectedRate ? selectedRate.price : 0;

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

      if (shippingDetails.address.length < 10) {
         setPaymentError('Shipping address must be at least 10 characters');
         return;
      }

      if (shippingDetails.city.length < 2) {
         setPaymentError('City name must be at least 2 characters');
         return;
      }

      if (shippingDetails.country.length < 2) {
         setPaymentError('Please select a valid country');
         return;
      }

      setIsProcessing(true);
      setPaymentError('');

      try {
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
            notes: selectedRateId ? `Shipping: ${selectedRate?.service} (${selectedRate?.provider})` : undefined
         });

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
            setStep('SUCCESS');
            await clearCart();
         } else {
            setStep('PAYMENT');
         }
      } catch (error: any) {
         console.error('Order creation failed:', error);
         setPaymentError(error.message || 'Failed to create order. Please try again.');
      } finally {
         setIsProcessing(false);
      }
   };

   const handlePaymentSuccess = async () => {
      setStep('SUCCESS');
      await clearCart();
   };

   const handlePaymentError = (error: string) => {
      setPaymentError(error);
   };

   const handleProceedToShipping = () => {
      if (!token) {
         navigate('/auth');
         return;
      }
      setStep('SHIPPING');
   };

   if (cartLoading) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-void text-pearl">
            <Loader2 className="w-8 h-8 animate-spin text-tangerine mb-4" />
            <p className="font-mono text-xs uppercase tracking-widest">Loading Cart...</p>
         </div>
      );
   }

   if (cart.length === 0 && step !== 'SUCCESS') {
      return (
         <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-void text-pearl px-4 relative overflow-hidden">
            <ParticleSystem />
            <div className="relative z-10 text-center">
               <h2 className="text-4xl font-display mb-4 text-pearl">Your Collection is Empty</h2>
               {cartError && <p className="text-red-500 mb-4 font-mono text-xs">{cartError}</p>}
               <Link to="/exhibitions" className="inline-block bg-tangerine text-void px-8 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-white transition-colors">
                  Browse Exhibitions
               </Link>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen pt-32 pb-20 bg-void text-pearl px-4 relative overflow-hidden">
         <ParticleSystem />
         <div className="max-w-6xl mx-auto relative z-10">

            {/* Stepper */}
            <div className="flex justify-center mb-16">
               <div className="flex items-center gap-4 text-[10px] md:text-xs uppercase tracking-widest">
                  <div className={cn("px-4 pb-2 border-b-2 transition-colors", step === 'CART' ? "border-tangerine text-tangerine font-bold" : "border-pearl/5 text-warm-gray")}>01 Collection</div>
                  <div className={cn("px-4 pb-2 border-b-2 transition-colors", step === 'SHIPPING' ? "border-tangerine text-tangerine font-bold" : "border-pearl/5 text-warm-gray")}>02 Details</div>
                  <div className={cn("px-4 pb-2 border-b-2 transition-colors", step === 'PAYMENT' ? "border-tangerine text-tangerine font-bold" : "border-pearl/5 text-warm-gray")}>03 Payment</div>
                  <div className={cn("px-4 pb-2 border-b-2 transition-colors", step === 'SUCCESS' ? "border-tangerine text-tangerine font-bold" : "border-pearl/5 text-warm-gray")}>04 Confirmation</div>
               </div>
            </div>

            {step === 'SUCCESS' ? (
               <div className="text-center max-w-lg mx-auto bg-charcoal/50 p-12 backdrop-blur-md border border-pearl/10 shadow-2xl animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tangerine to-amber-500"></div>
                  <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
                  <h2 className="font-display text-4xl text-pearl mb-2">
                     {paymentMethod === 'BANK' ? 'Order Placed' : 'Order Confirmed'}
                  </h2>
                  <p className="text-warm-gray mb-8 font-mono text-sm leading-relaxed">
                     {paymentMethod === 'BANK'
                        ? 'Thank you. Please complete the bank transfer to process your order.'
                        : 'Thank you for collecting with Muraqqa. An invoice has been emailed to you.'}
                  </p>
                  {whatsappNotify && <p className="text-green-400 text-xs mb-8 uppercase tracking-widest">WhatsApp updates enabled</p>}

                  <div className="space-y-3">
                     <Link
                        to={createdOrderId ? `/invoice/${createdOrderId}` : '#'}
                        target="_blank"
                        className="flex items-center justify-center gap-2 w-full bg-tangerine hover:bg-white text-void px-6 py-4 text-xs font-bold transition-colors uppercase tracking-[0.2em]"
                     >
                        <FileText size={16} /> View Invoice
                     </Link>

                     <Link
                        to="/"
                        className="flex items-center justify-center gap-2 w-full border border-pearl/10 hover:border-pearl/30 px-6 py-4 text-xs text-warm-gray hover:text-pearl transition-colors uppercase tracking-[0.2em]"
                     >
                        Return Home
                     </Link>
                  </div>
               </div>
            ) : (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                  {/* Left Column: Form/Items */}
                  <div className="lg:col-span-2 space-y-8">

                     {step === 'CART' && (
                        <div className="space-y-6">
                           {cart.map((item, idx) => (
                              <div key={`${item.id}-${idx}`} className="flex gap-6 bg-charcoal/30 p-6 border border-pearl/10 backdrop-blur-sm group hover:border-tangerine/30 transition-all">
                                 <div className="w-24 h-32 bg-black overflow-hidden relative">
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                 </div>
                                 <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                       <h3 className="text-2xl font-display text-pearl">{item.title}</h3>
                                       <p className="text-tangerine text-[10px] uppercase tracking-[0.2em] font-bold mt-1">{item.artistName}</p>
                                       <p className="text-warm-gray text-xs mt-3 font-mono">
                                          {item.selectedPrintSize === 'ORIGINAL' || !item.selectedPrintSize
                                             ? 'Original Artwork'
                                             : `Print: ${item.selectedPrintSize} (Fabric Canvas)`}
                                       </p>
                                       {item.quantity > 1 && (
                                          <p className="text-pearl text-[10px] mt-1 font-mono">Qty: {item.quantity}</p>
                                       )}
                                    </div>
                                    <div className="flex justify-between items-end">
                                       <p className="text-pearl font-mono text-lg">{formatCurrency(item.finalPrice)}</p>
                                       <button onClick={() => removeFromCart(item.id)} className="text-warm-gray hover:text-red-500 transition-colors uppercase text-[10px] tracking-widest font-bold flex items-center gap-2">
                                          <Trash2 size={14} /> Remove
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}

                     {step === 'SHIPPING' && (
                        <div className="bg-charcoal/30 p-8 border border-pearl/10 backdrop-blur-sm space-y-8 animate-fade-in relative">
                           <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-tangerine to-amber-500"></div>
                           <h3 className="font-display text-3xl text-pearl mb-6">Shipping Details</h3>

                           <div className="grid grid-cols-2 gap-6">
                              <input type="text" placeholder="FIRST NAME" value={shippingDetails.firstName} onChange={e => setShippingDetails({ ...shippingDetails, firstName: e.target.value })} className="bg-void border border-pearl/20 p-4 text-pearl focus:border-tangerine outline-none text-xs font-mono placeholder:text-warm-gray/50" />
                              <input type="text" placeholder="LAST NAME" value={shippingDetails.lastName} onChange={e => setShippingDetails({ ...shippingDetails, lastName: e.target.value })} className="bg-void border border-pearl/20 p-4 text-pearl focus:border-tangerine outline-none text-xs font-mono placeholder:text-warm-gray/50" />
                           </div>
                           <div>
                              <input type="text" placeholder="STREET ADDRESS (MIN 10 CHARS)" value={shippingDetails.address} onChange={e => setShippingDetails({ ...shippingDetails, address: e.target.value })} className="w-full bg-void border border-pearl/20 p-4 text-pearl focus:border-tangerine outline-none text-xs font-mono placeholder:text-warm-gray/50" />
                              {shippingDetails.address && shippingDetails.address.length < 10 && (
                                 <p className="text-red-500 text-[10px] mt-1 font-mono">Address too short</p>
                              )}
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div>
                                 <input type="text" placeholder="CITY" value={shippingDetails.city} onChange={e => setShippingDetails({ ...shippingDetails, city: e.target.value })} className="w-full bg-void border border-pearl/20 p-4 text-pearl focus:border-tangerine outline-none text-xs font-mono placeholder:text-warm-gray/50" />
                              </div>
                              <div>
                                 <select
                                    value={shippingDetails.country}
                                    onChange={(e) => setShippingDetails({ ...shippingDetails, country: e.target.value })}
                                    className="w-full bg-void border border-pearl/20 p-4 text-pearl focus:border-tangerine outline-none text-xs font-mono"
                                 >
                                    <option value="Pakistan">Pakistan</option>
                                    <option value="USA">United States</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="UAE">UAE</option>
                                 </select>
                              </div>
                           </div>

                           {/* Shipping Method Selection */}
                           <div className="pt-8 border-t border-pearl/10">
                              <h4 className="font-display text-xl text-pearl mb-4">Select Shipping</h4>
                              {loadingRates ? (
                                 <p className="text-warm-gray text-xs font-mono animate-pulse">Calculating rates...</p>
                              ) : (
                                 <div className="space-y-3">
                                    {shippingRates.map(rate => (
                                       <div
                                          key={rate.id}
                                          onClick={() => setSelectedRateId(rate.id)}
                                          className={cn("flex items-center justify-between p-4 border cursor-pointer transition-all", selectedRateId === rate.id ? "border-tangerine bg-tangerine/5" : "border-pearl/10 hover:border-pearl/30")}
                                       >
                                          <div>
                                             <p className="text-pearl text-xs font-bold uppercase tracking-wider">{rate.service}</p>
                                             <p className="text-warm-gray text-[10px] uppercase font-mono mt-1">{rate.provider} • {rate.estimatedDays}</p>
                                          </div>
                                          <p className="text-tangerine font-mono text-sm">{formatCurrency(rate.price)}</p>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>


                           {/* Payment Method Selection */}
                           <div className="pt-8 border-t border-pearl/10">
                              <h4 className="font-display text-xl text-pearl mb-4">Payment Method</h4>
                              <div className="flex gap-4">
                                 <button
                                    onClick={() => setPaymentMethod('STRIPE')}
                                    disabled={!stripeEnabled}
                                    className={cn("flex-1 py-4 border text-center transition-all text-xs uppercase tracking-widest font-bold", paymentMethod === 'STRIPE' ? "border-tangerine bg-tangerine/5 text-pearl" : "border-pearl/10 text-warm-gray hover:text-pearl", !stripeEnabled && "opacity-50 cursor-not-allowed")}
                                 >
                                    Credit Card
                                    {!stripeEnabled && <span className="block text-[8px] mt-1 normal-case font-medium opacity-50">(Unavailable)</span>}
                                 </button>
                                 <button
                                    onClick={() => setPaymentMethod('BANK')}
                                    className={cn("flex-1 py-4 border text-center transition-all text-xs uppercase tracking-widest font-bold", paymentMethod === 'BANK' ? "border-tangerine bg-tangerine/5 text-pearl" : "border-pearl/10 text-warm-gray hover:text-pearl")}
                                 >
                                    Bank Transfer
                                 </button>
                              </div>
                           </div>

                           <label className="flex items-center gap-3 text-warm-gray text-xs cursor-pointer mt-4 select-none group">
                              <input
                                 type="checkbox"
                                 checked={whatsappNotify}
                                 onChange={(e) => setWhatsappNotify(e.target.checked)}
                                 className="accent-tangerine w-4 h-4"
                              />
                              <span className="group-hover:text-pearl transition-colors uppercase tracking-wider text-[10px] font-bold">Get WhatsApp Updates</span>
                           </label>

                           {paymentError && (
                              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-4 border border-red-500/20 font-mono">
                                 <AlertCircle size={14} />
                                 {paymentError}
                              </div>
                           )}
                        </div>
                     )}

                     {step === 'PAYMENT' && pendingOrderId && (
                        <div className="space-y-6 animate-fade-in">
                           <div className="bg-charcoal/30 p-8 border border-pearl/10 backdrop-blur-sm">
                              <h3 className="font-display text-2xl text-pearl mb-6">Complete Payment</h3>

                              {paymentMethod === 'STRIPE' ? (
                                 <div className="space-y-4">
                                    <StripeCheckout
                                       orderId={pendingOrderId}
                                       amount={totalPKR}
                                       currency="pkr"
                                       onSuccess={handlePaymentSuccess}
                                       onError={handlePaymentError}
                                    />
                                    <p className="text-[10px] text-warm-gray text-center flex items-center justify-center gap-1 mt-4 uppercase tracking-wider">
                                       <Lock size={10} /> Secure SSL Encrypted Payment
                                    </p>
                                 </div>
                              ) : (
                                 <div className="bg-void p-6 border border-pearl/20 text-sm text-pearl font-mono">
                                    <p className="font-bold text-tangerine mb-4 text-base uppercase tracking-widest">Meezan Bank</p>
                                    <div className="space-y-2 text-xs">
                                       <p className="flex justify-between border-b border-pearl/10 pb-2"><span>Account Title:</span> <span className="text-white">Muraqqa Gallery</span></p>
                                       <p className="flex justify-between border-b border-pearl/10 pb-2"><span>Account No:</span> <span className="text-white">PK00 MEZN 0000 0000 1234 5678</span></p>
                                       <p className="flex justify-between border-b border-pearl/10 pb-2"><span>Branch Code:</span> <span className="text-white">0201</span></p>
                                    </div>
                                    <p className="mt-4 italic text-warm-gray/70 text-[10px]">
                                       Please upload proof of payment via email (orders@muraqqa.art) after checkout.
                                    </p>
                                 </div>
                              )}

                              {paymentError && (
                                 <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-4 border border-red-500/20 font-mono mt-4">
                                    <AlertCircle size={14} />
                                    {paymentError}
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Right Column: Summary */}
                  <div className="lg:col-span-1">
                     <div className="bg-charcoal/50 p-6 border border-pearl/10 sticky top-32 backdrop-blur-xl shadow-2xl">
                        <h3 className="font-display text-xl text-pearl mb-6">Summary</h3>

                        <div className="space-y-4 text-xs text-warm-gray pb-6 mb-6 border-b border-pearl/10 font-mono">
                           <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span className="text-pearl">{formatCurrency(subtotalPKR)}</span>
                           </div>
                           <div className="flex justify-between">
                              <span>Shipping</span>
                              <span className="text-pearl">{formatCurrency(shippingCostPKR)}</span>
                           </div>
                           <div className="flex justify-between">
                              <span>Tax {shippingDetails.country !== 'Pakistan' && '(5%)'}</span>
                              <span className="text-pearl">{formatCurrency(taxPKR)}</span>
                           </div>
                           {discountApplied > 0 && (
                              <div className="flex justify-between text-green-400">
                                 <span>Discount</span>
                                 <span>- {formatCurrency(discountApplied)}</span>
                              </div>
                           )}
                        </div>

                        {/* Promo Code */}
                        <div className="flex gap-2 mb-6">
                           <input
                              type="text"
                              value={discountCode}
                              onChange={(e) => setDiscountCode(e.target.value)}
                              placeholder="CODE"
                              className="flex-1 bg-void border border-pearl/20 px-3 py-2 text-xs text-pearl focus:border-tangerine outline-none font-mono placeholder:text-warm-gray/30"
                           />
                           <button onClick={handleApplyDiscount} className="bg-pearl/10 text-pearl hover:bg-tangerine hover:text-void px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all">Apply</button>
                        </div>

                        <div className="flex justify-between text-2xl font-display text-pearl mb-8 bg-void p-4 border border-pearl/10">
                           <span>Total</span>
                           <span className="text-tangerine">{formatCurrency(totalPKR)}</span>
                        </div>

                        {step === 'CART' && (
                           <>
                              <button
                                 onClick={handleProceedToShipping}
                                 className="w-full bg-tangerine hover:bg-white text-void py-4 uppercase tracking-[0.2em] text-xs font-bold transition-all shadow-[4px_4px_0px_#ffffff]"
                              >
                                 {token ? 'Checkout' : 'Login to Checkout'}
                              </button>
                              <Link
                                 to="/exhibitions"
                                 className="block w-full mt-4 text-warm-gray hover:text-tangerine py-2 text-[10px] uppercase tracking-[0.25em] transition-colors text-center font-bold"
                              >
                                 Continue Shopping
                              </Link>
                           </>
                        )}
                        {step === 'SHIPPING' && (
                           <>
                              <button
                                 onClick={handleProceedToPayment}
                                 disabled={
                                    isProcessing ||
                                    !shippingDetails.firstName ||
                                    !shippingDetails.address ||
                                    !shippingDetails.city ||
                                    shippingDetails.address.length < 10 ||
                                    shippingDetails.city.length < 2 ||
                                    !selectedRateId
                                 }
                                 className="w-full bg-tangerine hover:bg-white text-void py-4 uppercase tracking-[0.2em] text-xs font-bold transition-all shadow-[4px_4px_0px_#ffffff] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                 {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : 'Proceed'}
                              </button>

                              <button
                                 onClick={() => setStep('CART')}
                                 className="w-full mt-4 text-warm-gray hover:text-pearl py-2 text-[10px] uppercase tracking-[0.25em] transition-colors text-center font-bold"
                              >
                                 Back
                              </button>
                           </>
                        )}
                        {step === 'PAYMENT' && (
                           <button
                              onClick={() => setStep('SHIPPING')}
                              className="w-full mt-4 text-warm-gray hover:text-pearl py-2 text-[10px] uppercase tracking-[0.25em] transition-colors text-center font-bold"
                           >
                              Back
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
