import React, { useEffect, useState } from 'react';
import { Heart, Package, LogOut, MapPin, Plus, Trash2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi, orderApi } from '../services/api';
import { Address, Order } from '../types';

export const UserProfile: React.FC = () => {
   const { user, logout } = useAuth();
   const navigate = useNavigate();

   const [profile, setProfile] = useState<any>(null);
   const [orders, setOrders] = useState<Order[]>([]);
   const [addresses, setAddresses] = useState<Address[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Address Form State
   const [showAddressForm, setShowAddressForm] = useState(false);
   const [newAddress, setNewAddress] = useState({
      address: '',
      city: '',
      country: 'Pakistan',
      zipCode: '',
      type: 'SHIPPING',
      isDefault: false
   });

   useEffect(() => {
      const loadData = async () => {
         setIsLoading(true);
         try {
            // Fetch Profile & Addresses
            const { user: profileData } = await userApi.getProfile();
            setProfile(profileData);
            if (profileData.addresses) setAddresses(profileData.addresses);

            // Fetch Orders
            const { orders: orderData } = await orderApi.getUserOrders();
            // @ts-ignore - API returns ApiOrder[], we can assume compatibility for display or would need transform
            setOrders(orderData);

         } catch (err: any) {
            console.error('Failed to load profile:', err);
            setError('Failed to load profile data');
         } finally {
            setIsLoading(false);
         }
      };

      if (user) loadData();
      else navigate('/auth');
   }, [user, navigate]);

   const handleLogout = () => {
      logout();
      navigate('/');
   };

   const handleAddAddress = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         const { address } = await userApi.addAddress(newAddress);
         setAddresses(prev => [...prev, address]);
         setShowAddressForm(false);
         setNewAddress({ address: '', city: '', country: 'Pakistan', zipCode: '', type: 'SHIPPING', isDefault: false });
      } catch (err) {
         console.error('Failed to add address:', err);
      }
   };

   const handleDeleteAddress = async (id: string) => {
      if (!confirm('Are you sure you want to delete this address?')) return;
      try {
         await userApi.deleteAddress(id);
         setAddresses(prev => prev.filter(a => a.id !== id));
      } catch (err) {
         console.error('Failed to delete address:', err);
      }
   };

   if (isLoading) return <div className="pt-32 text-center text-white">Loading profile...</div>;

   return (
      <div className="pt-32 pb-12 max-w-6xl mx-auto px-4">
         <div className="flex items-center justify-between mb-12 border-b border-stone-800 pb-8">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center text-2xl font-serif text-amber-500">
                  {profile?.fullName?.substring(0, 2).toUpperCase() || 'US'}
               </div>
               <div>
                  <h1 className="font-serif text-3xl text-white">{profile?.fullName}</h1>
                  <p className="text-stone-500 uppercase tracking-widest text-xs mt-1">{profile?.email} • {profile?.role}</p>
               </div>
            </div>
            <button onClick={handleLogout} className="text-stone-500 hover:text-white flex items-center gap-2 text-sm"><LogOut size={16} /> Sign Out</button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Orders and Wishlist */}
            <div className="lg:col-span-2 space-y-12">

               {/* Orders */}
               <div className="space-y-6">
                  <h2 className="font-serif text-2xl text-white flex items-center gap-2"><Package size={20} className="text-amber-500" /> Order History</h2>
                  {orders.length === 0 ? (
                     <p className="text-stone-500 italic">No orders placed yet.</p>
                  ) : (
                     <div className="space-y-4">
                        {orders.map(order => (
                           <div key={order.id} className="bg-stone-900 border border-stone-800 p-6 flex items-center justify-between rounded-sm">
                              <div>
                                 <p className="text-white font-bold">Order #{order.id.slice(0, 8)}</p>
                                 <p className="text-stone-500 text-xs mt-1">Placed on {new Date(order.date || order.createdAt).toLocaleDateString()}</p>
                                 <div className="flex gap-2 mt-2">
                                    {order.items.map((item, idx) => (
                                       <span key={idx} className="text-stone-400 text-xs bg-stone-800 px-2 py-1 rounded">
                                          {item.artwork?.title || item.title} (x{item.quantity})
                                       </span>
                                    ))}
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className={`inline-block px-3 py-1 text-xs rounded-full border mb-2 ${order.status === 'DELIVERED' ? 'bg-green-900/30 text-green-500 border-green-900/50' :
                                       order.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-500 border-yellow-900/50' :
                                          'bg-stone-800 text-stone-400 border-stone-700'
                                    }`}>
                                    {order.status}
                                 </span>
                                 <p className="text-stone-300 text-sm">{order.currency || 'PKR'} {Number(order.totalAmount).toLocaleString()}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

            </div>

            {/* Right Column: Address Book */}
            <div>
               <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl text-white flex items-center gap-2"><MapPin size={20} className="text-amber-500" /> Address Book</h2>
                  <button
                     onClick={() => setShowAddressForm(!showAddressForm)}
                     className="text-amber-500 hover:text-amber-400 text-sm flex items-center gap-1"
                  >
                     <Plus size={16} /> Add New
                  </button>
               </div>

               {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="bg-stone-900 p-4 rounded-sm border border-stone-800 mb-6 space-y-4">
                     <input
                        className="w-full bg-stone-950 border border-stone-800 p-2 text-white text-sm"
                        placeholder="Full Address"
                        value={newAddress.address}
                        onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                        required
                     />
                     <div className="grid grid-cols-2 gap-4">
                        <input
                           className="w-full bg-stone-950 border border-stone-800 p-2 text-white text-sm"
                           placeholder="City"
                           value={newAddress.city}
                           onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                           required
                        />
                        <input
                           className="w-full bg-stone-950 border border-stone-800 p-2 text-white text-sm"
                           placeholder="Zip Code"
                           value={newAddress.zipCode}
                           onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                        />
                     </div>
                     <select
                        className="w-full bg-stone-950 border border-stone-800 p-2 text-white text-sm"
                        value={newAddress.country}
                        onChange={e => setNewAddress({ ...newAddress, country: e.target.value })}
                     >
                        <option value="Pakistan">Pakistan</option>
                        <option value="International">International (Other)</option>
                     </select>
                     <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddressForm(false)} className="text-stone-500 text-xs hover:text-white px-3 py-2">Cancel</button>
                        <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-sm">Save Address</button>
                     </div>
                  </form>
               )}

               <div className="space-y-4">
                  {addresses.length === 0 ? (
                     <p className="text-stone-500 italic text-sm">No addresses saved.</p>
                  ) : (
                     addresses.map(addr => (
                        <div key={addr.id} className="bg-stone-900 p-4 border border-stone-800 relative group">
                           <p className="text-white text-sm font-medium">{addr.address}</p>
                           <p className="text-stone-500 text-xs mt-1">{addr.city}, {addr.zipCode}</p>
                           <p className="text-stone-500 text-xs">{addr.country}</p>
                           {addr.isDefault && <span className="absolute top-4 right-4 text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded">Default</span>}

                           <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="absolute bottom-4 right-4 text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <Trash2 size={14} />
                           </button>
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};
