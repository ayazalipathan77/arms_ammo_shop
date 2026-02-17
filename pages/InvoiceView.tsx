import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useGallery } from '../context/GalleryContext';
import { Printer, ArrowLeft, Mail } from 'lucide-react';
import { orderApi } from '../services/api';
import type { Order } from '../types';

const formatPrice = (price: number | undefined | null) => {
   if (typeof price !== 'number') return 'PKR 0';
   return `PKR ${price.toLocaleString()}`;
};

export const InvoiceView: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const [searchParams] = useSearchParams();
   const { orders } = useGallery();
   const [order, setOrder] = useState<Order | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const hasPrinted = useRef(false);

   useEffect(() => {
      const fetchOrder = async () => {
         if (!id) {
            setError('No order ID provided');
            setLoading(false);
            return;
         }

         const contextOrder = orders.find(o => o.id === id);
         if (contextOrder) {
            setOrder(contextOrder);
            setLoading(false);
            return;
         }

         try {
            const { order: apiOrder } = await orderApi.getOrderById(id);

            if (!apiOrder) {
               throw new Error('Order not found');
            }

            const transformedOrder: Order = {
               id: apiOrder.id || id,
               customerName: apiOrder.user?.fullName || apiOrder.customerName || 'Customer',
               customerEmail: apiOrder.user?.email || apiOrder.customerEmail || '',
               items: (apiOrder.items || []).map((item: any) => ({
                  id: item.artwork?.id || item.artworkId || '',
                  title: item.artwork?.title || item.title || 'Untitled',
                  artistName: item.artwork?.artistName || item.artistName || 'Unknown Artist',
                  imageUrl: item.artwork?.imageUrl || item.imageUrl || '',
                  finalPrice: item.price || item.finalPrice || 0,
                  selectedPrintSize: item.type === 'ORIGINAL' ? 'ORIGINAL' : item.printSize || undefined,
                  dimensions: item.artwork?.dimensions || item.dimensions || '',
                  medium: item.artwork?.medium || item.medium || '',
                  quantity: item.quantity || 1
               })),
               totalAmount: apiOrder.totalAmount || 0,
               currency: (apiOrder.currency || 'PKR') as any,
               status: (apiOrder.status || 'PENDING') as any,
               date: apiOrder.createdAt ? new Date(apiOrder.createdAt) : new Date(),
               shippingAddress: apiOrder.shippingAddress
                  ? `${apiOrder.shippingAddress}${apiOrder.shippingCity ? ', ' + apiOrder.shippingCity : ''}`
                  : 'N/A',
               shippingCountry: apiOrder.shippingCountry || 'N/A',
               trackingNumber: apiOrder.trackingNumber || undefined,
               paymentMethod: (apiOrder.paymentMethod || 'CARD') as any,
               transactionId: apiOrder.transactionId || undefined,
            };
            setOrder(transformedOrder);
         } catch (err: any) {
            console.error('Failed to fetch order:', err);
            setError(err.message || 'Failed to load invoice');
         } finally {
            setLoading(false);
         }
      };

      fetchOrder();
   }, [id, orders]);

   // Auto-open print dialog when ?print=true is in URL
   useEffect(() => {
      if (order && !loading && searchParams.get('print') === 'true' && !hasPrinted.current) {
         hasPrinted.current = true;
         // Small delay to ensure the invoice is fully rendered
         const timer = setTimeout(() => window.print(), 500);
         return () => clearTimeout(timer);
      }
   }, [order, loading, searchParams]);

   if (loading) {
      return (
         <div className="min-h-screen bg-white flex items-center justify-center">
            <p className="font-mono text-sm tracking-widest text-black animate-pulse">LOADING INVOICE...</p>
         </div>
      );
   }

   if (error || !order) {
      return (
         <div className="min-h-screen bg-white flex items-center justify-center text-center">
            <div>
               <h2 className="text-2xl font-display text-black mb-4">INVOICE NOT FOUND</h2>
               <Link to="/" className="text-sm font-mono border-b border-black pb-1 hover:opacity-50">RETURN TO GALLERY</Link>
            </div>
         </div>
      );
   }

   const itemsTotal = order.items.reduce((sum, item) => sum + item.finalPrice, 0);
   const shippingAndTax = order.totalAmount - itemsTotal;

   const handleDownloadPDF = () => {
      // Trigger browser print dialog (user can save as PDF)
      window.print();
   };

   return (
      <>
         {/* Print-specific styles */}
         <style>{`
            @media print {
               @page {
                  size: A4;
                  margin: 0;
               }
               body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
               }
               /* Ensure clean black/white print */
               * {
                  color: black !important;
                  background: white !important;
               }
               /* Hide all non-invoice elements */
               nav, header, footer, .print\\:hidden {
                  display: none !important;
               }
            }
         `}</style>

         <div className="min-h-screen bg-white text-black font-sans py-12 px-4 print:p-0">

            {/* Actions */}
            <div className="max-w-[210mm] mx-auto mb-12 flex justify-between items-center print:hidden">
               <Link to="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-50 transition-opacity">
                  <ArrowLeft size={14} /> Back
               </Link>
               <div className="flex gap-4">
                  <button
                     onClick={handleDownloadPDF}
                     className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center gap-2"
                  >
                     <Printer size={14} /> Download PDF
                  </button>
               </div>
            </div>

            {/* Invoice Layout */}
            <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] relative p-12 md:p-16 border border-zinc-100 shadow-xl print:shadow-none print:border-none print:w-full">

               {/* Header Section */}
               <div className="flex justify-between items-start mb-24">
                  <div className="space-y-6">
                     {/* Logo */}
                     <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                           <h1 className="font-display text-5xl tracking-tight leading-none text-black selection:bg-black selection:text-white">
                              ARMS & AMMO
                           </h1>
                           <span className="text-3xl text-amber-600" style={{ fontFamily: "var(--font-urdu)" }}>مرقع</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.3em] font-medium mt-2 ml-1 text-black">Premium Firearms & Gear</span>
                     </div>

                     <div className="text-xs font-mono space-y-1 mt-8 opacity-60">
                        <p>DHA Phase 6, Lahore</p>
                        <p>Pakistan</p>
                        <p>support@armsammo.shop</p>
                     </div>
                  </div>

                  <div className="text-right">
                     <p className="text-4xl font-mono mb-2">{formatPrice(order.totalAmount)}</p>
                     <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Total Due</p>
                  </div>
               </div>

               {/* Invoice Meta */}
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-20 pb-12 border-b border-black">
                  <div>
                     <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2">Invoice No</p>
                     <p className="font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                     <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2">Date Issued</p>
                     <p className="font-mono text-sm">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                     <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2">Billed To</p>
                     <p className="font-display text-lg">{order.customerName}</p>
                     <p className="font-mono text-xs opacity-60 break-all">{order.customerEmail}</p>
                  </div>
                  <div>
                     <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-2">Ship To</p>
                     <p className="font-mono text-xs leading-relaxed">
                        {order.shippingAddress},<br />
                        {order.shippingCountry}
                     </p>
                  </div>
               </div>

               {/* Line Items */}
               <div className="mb-12">
                  <table className="w-full">
                     <thead>
                        <tr className="border-b border-black">
                           <th className="text-left py-4 text-[10px] uppercase tracking-widest font-bold opacity-40 w-1/2">Product</th>
                           <th className="text-center py-4 text-[10px] uppercase tracking-widest font-bold opacity-40">Category</th>
                           <th className="text-right py-4 text-[10px] uppercase tracking-widest font-bold opacity-40">Price</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-100">
                        {order.items.map((item, idx) => (
                           <tr key={`${item.id}-${idx}`}>
                              <td className="py-8">
                                 <div className="flex gap-6 items-start">
                                    <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0 grayscale">
                                       <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                       <p className="font-display text-xl mb-1">{item.title}</p>
                                       <p className="text-xs uppercase tracking-wider font-bold opacity-60 mb-2">{item.artistName}</p>
                                       <p className="text-[10px] font-mono opacity-40">{item.dimensions} — {item.medium}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-8 text-center text-xs font-mono uppercase">
                                 {item.selectedPrintSize === 'ORIGINAL' || !item.selectedPrintSize ? 'Original' : `Print: ${item.selectedPrintSize}`}
                              </td>
                              <td className="py-8 text-right font-mono text-sm">
                                 {formatPrice(item.finalPrice)}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {/* Summary */}
               <div className="flex justify-end mb-24">
                  <div className="w-64 space-y-4">
                     <div className="flex justify-between text-xs font-mono">
                        <span className="opacity-40">Subtotal</span>
                        <span>{formatPrice(itemsTotal)}</span>
                     </div>
                     <div className="flex justify-between text-xs font-mono">
                        <span className="opacity-40">Shipping & Tax</span>
                        <span>{formatPrice(shippingAndTax)}</span>
                     </div>
                     <div className="flex justify-between text-lg font-display pt-4 border-t border-black">
                        <span>Total</span>
                        <span>{formatPrice(order.totalAmount)}</span>
                     </div>
                  </div>
               </div>

               {/* Footer */}
               <div className="text-center space-y-4">
                  <div className="h-px w-16 bg-black mx-auto mb-8"></div>
                  <p className="font-display text-2xl">Thank you for your patronage</p>
                  <div className="flex justify-center gap-6 text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">
                     <span>www.armsammo.shop</span>
                     <span>•</span>
                     <span>est. 2024</span>
                  </div>
               </div>

            </div>
         </div>
      </>
   );
};
