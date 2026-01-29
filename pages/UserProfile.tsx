import React, { useEffect, useState } from 'react';
import { Heart, Package, LogOut, MapPin, Plus, Trash2, Edit, User, Mail, Phone, Globe, Save, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi, orderApi } from '../services/api';
import { Address, Order } from '../types';

export const UserProfile: React.FC = () => {
   const { user, logout } = useAuth();
   const navigate = useNavigate();

   const [activeTab, setActiveTab] = useState<'SETTINGS' | 'ORDERS' | 'ADDRESSES'>('SETTINGS');
   const [profile, setProfile] = useState<any>(null);
   const [orders, setOrders] = useState<Order[]>([]);
   const [addresses, setAddresses] = useState<Address[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [successMsg, setSuccessMsg] = useState('');

   // Form State
   const [phoneNumber, setPhoneNumber] = useState('');

   // Default Address Form State (for Settings tab)
   const [defaultAddress, setDefaultAddress] = useState({
      address: '',
      city: '',
      country: 'Pakistan',
      zipCode: ''
   });

   // Address Book Form State (for Addresses tab)
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
            setPhoneNumber(profileData.phoneNumber || '');

            if (profileData.addresses) {
               setAddresses(profileData.addresses);
               const def = profileData.addresses.find((a: any) => a.isDefault);
               if (def) {
                  setDefaultAddress({
                     address: def.address,
                     city: def.city,
                     country: def.country,
                     zipCode: def.zipCode || ''
                  });
               }
            }

            // Fetch Orders
            const { orders: orderData } = await orderApi.getUserOrders();
            // @ts-ignore
            setOrders(orderData);

         } catch (err: any) {
            console.error('Failed to load profile:', err);
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

   // Update Profile (Phone) and Default Address
   const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      setSuccessMsg('');

      try {
         // 1. Update Phone
         if (phoneNumber !== profile.phoneNumber) {
            await userApi.updateProfile({ phoneNumber });
         }

         // 2. Update Default Address (If changed)
         // Logic: check if current form values differ from potentially existing default address
         // For simplicity in this user request context: we will always add a new default address if the user clicks save on this form, 
         // effectively "updating" it by creating a new current default.
         // Optimization: Check if fields are not empty
         if (defaultAddress.address && defaultAddress.city) {
            await userApi.addAddress({
               ...defaultAddress,
               type: 'SHIPPING',
               isDefault: true
            });

            // Refresh addresses locally
            const { user: updatedProfile } = await userApi.getProfile();
            setAddresses(updatedProfile.addresses);
         }

         setSuccessMsg('Profile updated successfully.');
         setTimeout(() => setSuccessMsg(''), 3000);

      } catch (err) {
         console.error('Failed to update profile:', err);
      } finally {
         setIsSaving(false);
      }
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
      <div className="pt-32 pb-20 max-w-6xl mx-auto px-4 min-h-screen">

         {/* Profile Header */}
         <div className="flex flex-col md:flex-row items-center justify-between mb-12 border-b border-stone-800 pb-8 gap-6">
            <div className="flex items-center gap-6">
               <div className="w-24 h-24 bg-stone-900 rounded-full flex items-center justify-center text-3xl font-serif text-amber-500 border-2 border-stone-800">
                  {profile?.fullName?.substring(0, 2).toUpperCase() || 'US'}
               </div>
               <div>
                  <h1 className="font-serif text-3xl md:text-4xl text-white">{profile?.fullName}</h1>
                  <p className="text-stone-500 uppercase tracking-widest text-xs mt-2 flex gap-3">
                     <span>{profile?.role}</span>
                     <span>•</span>
                     <span>{profile?.email}</span>
                  </p>
               </div>
            </div>
            <button onClick={handleLogout} className="text-stone-500 hover:text-white flex items-center gap-2 text-sm border border-stone-800 px-4 py-2 hover:bg-stone-900 transition-colors">
               <LogOut size={16} /> Sign Out
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Sidebar Tabs */}
            <div className="lg:col-span-1 space-y-1">
               <button
                  onClick={() => setActiveTab('SETTINGS')}
                  className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${activeTab === 'SETTINGS' ? 'bg-amber-600 text-white' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'}`}
               >
                  <User size={16} /> Profile Settings
               </button>
               <button
                  onClick={() => setActiveTab('ORDERS')}
                  className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${activeTab === 'ORDERS' ? 'bg-amber-600 text-white' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'}`}
               >
                  <Package size={16} /> Order History
               </button>
               <button
                  onClick={() => setActiveTab('ADDRESSES')}
                  className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${activeTab === 'ADDRESSES' ? 'bg-amber-600 text-white' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'}`}
               >
                  <MapPin size={16} /> Address Book
               </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 bg-stone-900/30 border border-stone-800 min-h-[500px] p-8">

               {/* SETTINGS TAB */}
               {activeTab === 'SETTINGS' && (
                  <div className="animate-fade-in max-w-2xl">
                     <h2 className="font-serif text-2xl text-white mb-8">Account Settings</h2>

                     <form onSubmit={handleUpdateProfile} className="space-y-8">
                        {/* Read-Only Info */}
                        <div className="space-y-6 bg-stone-900/50 p-6 rounded border border-stone-800/50">
                           <h3 className="text-amber-500 text-xs uppercase tracking-widest font-bold mb-4">Account Information (Read Only)</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wider">
                                    <User size={12} /> Full Name
                                 </label>
                                 <input
                                    type="text"
                                    value={profile?.fullName || ''}
                                    disabled
                                    className="w-full bg-stone-950 border border-stone-800 text-stone-400 p-3 cursor-not-allowed"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wider">
                                    <Mail size={12} /> Email Address
                                 </label>
                                 <input
                                    type="text"
                                    value={profile?.email || ''}
                                    disabled
                                    className="w-full bg-stone-950 border border-stone-800 text-stone-400 p-3 cursor-not-allowed"
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Editable Personal Details */}
                        <div className="space-y-6">
                           <h3 className="text-white text-lg font-serif">Personal Details</h3>
                           <div className="space-y-2">
                              <label className="flex items-center gap-2 text-stone-400 text-xs uppercase tracking-wider">
                                 <Phone size={12} /> Phone Number
                              </label>
                              <input
                                 type="tel"
                                 value={phoneNumber}
                                 onChange={e => setPhoneNumber(e.target.value)}
                                 placeholder="+92..."
                                 className="w-full bg-stone-950 border border-stone-700 text-white p-3 focus:border-amber-500 outline-none transition-colors"
                              />
                           </div>
                        </div>

                        {/* Editable Default Address */}
                        <div className="space-y-6 pt-6 border-t border-stone-800">
                           <h3 className="text-white text-lg font-serif">Default Shipping Address</h3>
                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <label className="flex items-center gap-2 text-stone-400 text-xs uppercase tracking-wider">
                                    <MapPin size={12} /> Address Line
                                 </label>
                                 <input
                                    type="text"
                                    value={defaultAddress.address}
                                    onChange={e => setDefaultAddress({ ...defaultAddress, address: e.target.value })}
                                    className="w-full bg-stone-950 border border-stone-700 text-white p-3 focus:border-amber-500 outline-none transition-colors"
                                 />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <label className="text-stone-400 text-xs uppercase tracking-wider">
                                       City
                                    </label>
                                    <input
                                       type="text"
                                       value={defaultAddress.city}
                                       onChange={e => setDefaultAddress({ ...defaultAddress, city: e.target.value })}
                                       className="w-full bg-stone-950 border border-stone-700 text-white p-3 focus:border-amber-500 outline-none transition-colors"
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-stone-400 text-xs uppercase tracking-wider">
                                       Zip Code
                                    </label>
                                    <input
                                       type="text"
                                       value={defaultAddress.zipCode}
                                       onChange={e => setDefaultAddress({ ...defaultAddress, zipCode: e.target.value })}
                                       className="w-full bg-stone-950 border border-stone-700 text-white p-3 focus:border-amber-500 outline-none transition-colors"
                                    />
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="flex items-center gap-2 text-stone-400 text-xs uppercase tracking-wider">
                                    <Globe size={12} /> Country
                                 </label>
                                 <select
                                    value={defaultAddress.country}
                                    onChange={(e) => setDefaultAddress({ ...defaultAddress, country: e.target.value })}
                                    className="w-full bg-stone-950 border border-stone-700 text-white p-3 focus:border-amber-500 outline-none transition-colors"
                                 >
                                    <option value="Pakistan">Pakistan</option>
                                    <option value="UAE">UAE</option>
                                    <option value="UK">UK</option>
                                    <option value="USA">USA</option>
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                           <button
                              type="submit"
                              disabled={isSaving}
                              className="bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-white px-8 py-3 uppercase tracking-widest text-xs font-bold flex items-center gap-2 transition-all"
                           >
                              {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                           </button>
                           {successMsg && (
                              <span className="text-green-500 text-sm flex items-center gap-2 animate-fade-in">
                                 <CheckCircle size={16} /> {successMsg}
                              </span>
                           )}
                        </div>
                     </form>
                  </div>
               )}

               {/* ORDERS TAB */}
               {activeTab === 'ORDERS' && (
                  <div className="animate-fade-in space-y-6">
                     <div className="flex items-center justify-between mb-8">
                        <h2 className="font-serif text-2xl text-white">Order History</h2>
                        <p className="text-stone-500 text-xs uppercase tracking-widest">{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</p>
                     </div>
                     {orders.length === 0 ? (
                        <div className="text-center py-16 border border-stone-800 bg-stone-900/30">
                           <Package className="w-16 h-16 text-stone-700 mx-auto mb-4" />
                           <p className="text-stone-500 text-lg mb-2">No orders yet</p>
                           <p className="text-stone-600 text-sm mb-6">Start collecting art to see your order history here.</p>
                           <Link to="/gallery" className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 text-xs uppercase tracking-wider font-bold transition-colors">
                              Browse Gallery
                           </Link>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {orders.map((order: any) => (
                              <div key={order.id} className="bg-stone-900/50 border border-stone-800 hover:border-stone-700 transition-all group">
                                 <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                       <div className="flex items-center gap-3 mb-2">
                                          <h3 className="text-white font-mono text-sm">#{order.id.slice(0, 12).toUpperCase()}</h3>
                                          <span className={`inline-block px-2 py-1 text-[10px] rounded-sm uppercase tracking-widest font-bold border ${
                                             order.status === 'DELIVERED' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
                                             order.status === 'PENDING' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/30' :
                                             order.status === 'PROCESSING' ? 'bg-blue-900/20 text-blue-400 border-blue-900/30' :
                                             order.status === 'SHIPPED' ? 'bg-purple-900/20 text-purple-400 border-purple-900/30' :
                                             order.status === 'CANCELLED' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
                                             'bg-stone-800 text-stone-400 border-stone-700'
                                          }`}>
                                             {order.status}
                                          </span>
                                       </div>
                                       <p className="text-stone-500 text-xs mb-3">
                                          Placed on {new Date(order.createdAt || order.date).toLocaleDateString('en-US', {
                                             year: 'numeric',
                                             month: 'long',
                                             day: 'numeric'
                                          })}
                                       </p>
                                       <div className="flex flex-wrap gap-2">
                                          {order.items.slice(0, 3).map((item: any, idx: number) => (
                                             <div key={idx} className="flex items-center gap-2 bg-stone-950 px-3 py-2 border border-stone-800 group-hover:border-stone-700 transition-colors">
                                                {item.artwork?.imageUrl && (
                                                   <img src={item.artwork.imageUrl} alt={item.artwork.title} className="w-8 h-8 object-cover border border-stone-700" />
                                                )}
                                                <span className="text-stone-400 text-xs font-medium">
                                                   {item.artwork?.title || item.title}
                                                </span>
                                                <span className="text-stone-600 text-xs">×{item.quantity}</span>
                                             </div>
                                          ))}
                                          {order.items.length > 3 && (
                                             <div className="flex items-center px-3 py-2 text-stone-500 text-xs">
                                                +{order.items.length - 3} more
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 space-y-3">
                                       <div>
                                          <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Total Amount</p>
                                          <p className="text-white text-xl font-mono font-bold">
                                             {order.currency || 'PKR'} {Number(order.totalAmount).toLocaleString()}
                                          </p>
                                       </div>
                                       <Link
                                          to={`/invoice/${order.id}`}
                                          target="_blank"
                                          className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors"
                                       >
                                          View Invoice →
                                       </Link>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {/* ADDRESSES TAB */}
               {activeTab === 'ADDRESSES' && (
                  <div className="animate-fade-in">
                     <div className="flex items-center justify-between mb-8">
                        <h2 className="font-serif text-2xl text-white">Address Book</h2>
                        <button
                           onClick={() => setShowAddressForm(!showAddressForm)}
                           className="text-amber-500 hover:text-amber-400 text-sm flex items-center gap-1 uppercase tracking-wider font-bold"
                        >
                           <Plus size={16} /> Add New Address
                        </button>
                     </div>

                     {showAddressForm && (
                        <form onSubmit={handleAddAddress} className="bg-stone-900 p-6 border border-stone-800 mb-8 space-y-4 animate-fade-in">
                           <h3 className="text-white text-sm font-bold mb-2">New Address Details</h3>
                           <input
                              className="w-full bg-stone-950 border border-stone-800 p-3 text-white text-sm"
                              placeholder="Full Address"
                              value={newAddress.address}
                              onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                              required
                           />
                           <div className="grid grid-cols-2 gap-4">
                              <input
                                 className="w-full bg-stone-950 border border-stone-800 p-3 text-white text-sm"
                                 placeholder="City"
                                 value={newAddress.city}
                                 onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                 required
                              />
                              <input
                                 className="w-full bg-stone-950 border border-stone-800 p-3 text-white text-sm"
                                 placeholder="Zip Code"
                                 value={newAddress.zipCode}
                                 onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                              />
                           </div>
                           <select
                              className="w-full bg-stone-950 border border-stone-800 p-3 text-white text-sm"
                              value={newAddress.country}
                              onChange={e => setNewAddress({ ...newAddress, country: e.target.value })}
                           >
                              <option value="Pakistan">Pakistan</option>
                              <option value="International">International (Other)</option>
                           </select>
                           <div className="flex justify-end gap-3 pt-2">
                              <button type="button" onClick={() => setShowAddressForm(false)} className="text-stone-500 text-xs hover:text-white px-4 py-2">Cancel</button>
                              <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-6 py-2 uppercase tracking-wide font-bold">Save Address</button>
                           </div>
                        </form>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.length === 0 ? (
                           <p className="text-stone-500 italic text-sm col-span-2">No addresses saved.</p>
                        ) : (
                           addresses.map(addr => (
                              <div key={addr.id} className={`bg-stone-900 p-6 border relative group transition-colors ${addr.isDefault ? 'border-amber-500/50' : 'border-stone-800 hover:border-stone-700'}`}>
                                 <div className="flex items-start justify-between mb-2">
                                    <MapPin className="text-stone-600" size={20} />
                                    {addr.isDefault && <span className="text-[10px] bg-amber-900/20 text-amber-500 px-2 py-1 uppercase tracking-widest border border-amber-900/30">Default</span>}
                                 </div>
                                 <p className="text-white text-sm font-medium leading-relaxed">{addr.address}</p>
                                 <p className="text-stone-500 text-xs mt-2 uppercase tracking-wide">{addr.city}, {addr.zipCode}</p>
                                 <p className="text-stone-500 text-xs">{addr.country}</p>

                                 {!addr.isDefault && (
                                    <button
                                       onClick={() => handleDeleteAddress(addr.id)}
                                       className="absolute bottom-4 right-4 text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                       title="Delete Address"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 )}
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               )}

            </div>
         </div>
      </div>
   );
};
