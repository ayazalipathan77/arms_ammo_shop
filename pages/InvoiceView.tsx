import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGallery } from '../context/GalleryContext';
import { Printer, ArrowLeft, Mail, MapPin, Globe, Loader2 } from 'lucide-react';
import { orderApi } from '../services/api';
import type { Order } from '../types';

const convertPrice = (price: number) => `PKR ${price.toLocaleString()}`;

export const InvoiceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { orders } = useGallery();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('No order ID provided');
        setLoading(false);
        return;
      }

      // First try to find in context
      const contextOrder = orders.find(o => o.id === id);
      if (contextOrder) {
        setOrder(contextOrder);
        setLoading(false);
        return;
      }

      // If not in context, fetch from backend
      try {
        const { order: apiOrder } = await orderApi.getOrderById(id);

        // Transform API order to match Order type
        const transformedOrder: Order = {
          id: apiOrder.id,
          customerName: apiOrder.user?.fullName || 'Customer',
          customerEmail: apiOrder.user?.email || '',
          items: apiOrder.items.map(item => ({
            id: item.artwork.id,
            title: item.artwork.title,
            artistName: item.artwork.artistName || 'Unknown Artist',
            imageUrl: item.artwork.imageUrl,
            finalPrice: item.price,
            selectedPrintSize: item.type === 'ORIGINAL' ? 'ORIGINAL' : item.printSize || undefined,
            dimensions: item.artwork.dimensions || '',
            medium: item.artwork.medium || '',
            quantity: item.quantity
          })),
          totalAmount: apiOrder.totalAmount,
          currency: apiOrder.currency as any,
          status: apiOrder.status as any,
          date: new Date(apiOrder.createdAt),
          shippingAddress: `${apiOrder.shippingAddress}, ${apiOrder.shippingCity}`,
          shippingCountry: apiOrder.shippingCountry,
          trackingNumber: apiOrder.trackingNumber || undefined,
          paymentMethod: apiOrder.paymentMethod as any,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-stone-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
         <div className="text-center">
            <h2 className="text-2xl text-white font-serif mb-4">Invoice Not Found</h2>
            <p className="text-stone-400 mb-6">{error || 'The requested invoice could not be found.'}</p>
            <Link to="/" className="text-amber-500 hover:underline">Return Home</Link>
         </div>
      </div>
    );
  }

  // Calculate taxes/shipping for display if not explicitly saved in order (mock logic re-calculation or assume stored)
  // Since Order type has totalAmount but not breakdown, we'll infer or simplistic display for now based on Order interface.
  // Ideally Order interface should store breakdown. For this view, we will just list items and total.
  // Or we can calculate backward if needed, but let's just show items sum + implicit shipping line.
  
  const itemsTotal = order.items.reduce((sum, item) => sum + item.finalPrice, 0);
  const shippingAndTax = order.totalAmount - itemsTotal;

  return (
    <div className="min-h-screen bg-stone-900 pt-12 pb-12 px-4 font-sans print:bg-white print:p-0">
      
      {/* Navigation / Actions (Hidden on Print) */}
      <div className="max-w-[210mm] mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link to="/" className="text-stone-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} /> Back to Gallery
        </Link>
        <div className="flex gap-4">
           <button 
             onClick={() => alert(`Simulating email resend to ${order.customerEmail}...`)}
             className="text-stone-400 hover:text-white flex items-center gap-2 text-sm"
           >
             <Mail size={16} /> Email Again
           </button>
           <button 
             onClick={() => window.print()}
             className="bg-amber-600 text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-amber-500 shadow-lg"
           >
             <Printer size={16} /> Print Invoice
           </button>
        </div>
      </div>

      {/* Invoice Paper A4 */}
      <div className="max-w-[210mm] mx-auto bg-white text-stone-900 min-h-[297mm] shadow-2xl print:shadow-none print:w-full print:min-h-0 relative overflow-hidden">
        
        {/* Decorative Top Border */}
        <div className="h-1 bg-gradient-to-r from-stone-900 via-amber-500 to-stone-900 w-full"></div>

        <div className="p-12">
           {/* Header */}
           <div className="flex justify-between items-start mb-16">
              <div>
                 <h1 className="font-serif text-4xl text-stone-900 font-bold tracking-tight mb-2">INVOICE</h1>
                 <p className="text-stone-500 text-sm uppercase tracking-widest">#{order.id}</p>
                 <div className="mt-4 space-y-1 text-sm text-stone-600">
                    <p>Date: <span className="font-mono text-stone-900">{new Date(order.date).toLocaleDateString()}</span></p>
                    <p>Status: <span className="font-bold text-green-700 uppercase">{order.status}</span></p>
                    {order.transactionId && <p>Trans ID: <span className="font-mono">{order.transactionId}</span></p>}
                 </div>
              </div>
              <div className="text-right">
                 <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-[0.15em] bg-gradient-to-b from-amber-500 via-yellow-600 to-amber-700 bg-clip-text text-transparent drop-shadow-sm mb-2">
                    MURAQQA
                 </h2>
                 <div className="h-px w-full bg-gradient-to-l from-transparent via-amber-500 to-transparent opacity-50 mb-4"></div>
                 <p className="text-xs uppercase tracking-widest text-stone-700 font-bold">Contemporary Art Gallery</p>
                 <div className="mt-4 text-sm text-stone-500 space-y-1">
                    <p>DHA Phase 6, Lahore</p>
                    <p>Pakistan</p>
                    <p>support@muraqqa.art</p>
                    <p>+92 300 123 4567</p>
                 </div>
              </div>
           </div>

           {/* Bill To / Ship To */}
           <div className="flex justify-between mb-16 border-t border-b border-stone-200 py-8">
              <div className="w-1/2 pr-8">
                 <h3 className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-4">Bill To</h3>
                 <p className="font-serif text-xl font-bold text-stone-900">{order.customerName}</p>
                 <p className="text-stone-600 mt-2 text-sm">{order.customerEmail}</p>
              </div>
              <div className="w-1/2 pl-8 border-l border-stone-200">
                 <h3 className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-4">Ship To</h3>
                 <p className="text-stone-800 text-sm leading-relaxed max-w-xs">
                    {order.shippingAddress}<br/>
                    <span className="font-bold">{order.shippingCountry}</span>
                 </p>
              </div>
           </div>

           {/* Items Table */}
           <table className="w-full mb-12">
              <thead>
                 <tr className="border-b-2 border-stone-900">
                    <th className="text-left py-4 text-xs uppercase tracking-widest text-stone-500 font-bold w-1/2">Artwork Details</th>
                    <th className="text-center py-4 text-xs uppercase tracking-widest text-stone-500 font-bold">Type</th>
                    <th className="text-right py-4 text-xs uppercase tracking-widest text-stone-500 font-bold">Price</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                 {order.items.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`}>
                       <td className="py-6">
                          <div className="flex gap-4 items-center">
                             <img src={item.imageUrl} alt={item.title} className="w-16 h-16 object-cover border border-stone-200 rounded-sm" />
                             <div>
                                <p className="font-serif text-lg font-bold text-stone-900">{item.title}</p>
                                <p className="text-xs uppercase tracking-wider text-amber-600">{item.artistName}</p>
                                <p className="text-xs text-stone-400 mt-1">{item.dimensions} • {item.medium}</p>
                             </div>
                          </div>
                       </td>
                       <td className="py-6 text-center">
                          <span className="inline-block px-3 py-1 bg-stone-100 text-stone-600 text-xs rounded-full border border-stone-200">
                             {item.selectedPrintSize === 'ORIGINAL' || !item.selectedPrintSize ? 'Original' : `Print: ${item.selectedPrintSize} (Fabric Canvas)`}
                          </span>
                       </td>
                       <td className="py-6 text-right font-mono text-stone-800">
                          {convertPrice(item.finalPrice)}
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>

           {/* Totals */}
           <div className="flex justify-end mb-16">
              <div className="w-80 space-y-3">
                 <div className="flex justify-between text-sm text-stone-500">
                    <span>Subtotal</span>
                    <span className="font-mono text-stone-900">{convertPrice(itemsTotal)}</span>
                 </div>
                 <div className="flex justify-between text-sm text-stone-500">
                    <span>Shipping & Handling</span>
                    <span className="font-mono text-stone-900">{convertPrice(shippingAndTax)}</span>
                 </div>
                 <div className="h-px bg-stone-200 my-2"></div>
                 <div className="flex justify-between text-xl font-serif font-bold text-stone-900">
                    <span>Total</span>
                    <span>{convertPrice(order.totalAmount)}</span>
                 </div>
              </div>
           </div>

           {/* Footer */}
           <div className="mt-auto border-t border-stone-200 pt-8 text-center text-stone-500 text-sm">
              <p className="font-serif italic text-lg text-stone-800 mb-4">Thank you for collecting with Muraqqa.</p>
              <div className="flex justify-center gap-8 text-xs uppercase tracking-widest text-stone-400">
                 <span className="flex items-center gap-1"><Globe size={12}/> www.muraqqa.art</span>
                 <span className="flex items-center gap-1"><MapPin size={12}/> Lahore, PK</span>
              </div>
              <p className="mt-8 text-[10px] text-stone-300">
                 Muraqqa Gallery Pvt Ltd. NTN: 1234567-8. All rights reserved.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
