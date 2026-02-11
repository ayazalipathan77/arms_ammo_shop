import React, { useEffect, useState } from 'react';
import { Heart, Package, LogOut, MapPin, Plus, Trash2, Edit, User, Mail, Phone, Globe, Save, CheckCircle, Smartphone, Box, Gift, Copy, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi, orderApi } from '../services/api';
import { Address, Order } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import ParticleSystem from '../components/features/ParticleSystem';
import { motion, AnimatePresence } from 'framer-motion';

export const UserProfile: React.FC = () => {
   const { user, logout } = useAuth();
   const navigate = useNavigate();

   const [activeTab, setActiveTab] = useState<'SETTINGS' | 'ORDERS' | 'ADDRESSES' | 'REFERRALS'>('SETTINGS');
   const [profile, setProfile] = useState<any>(null);
   const [orders, setOrders] = useState<Order[]>([]);
   const [addresses, setAddresses] = useState<Address[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [successMsg, setSuccessMsg] = useState('');

   const [phoneNumber, setPhoneNumber] = useState('');

   const [defaultAddress, setDefaultAddress] = useState({
      address: '', city: '', country: 'Pakistan', zipCode: ''
   });

   const [showAddressForm, setShowAddressForm] = useState(false);
   const [newAddress, setNewAddress] = useState({
      address: '', city: '', country: 'Pakistan', zipCode: '', type: 'SHIPPING', isDefault: false
   });

   // Referral state
   const [referralData, setReferralData] = useState<any>(null);
   const [copiedReferral, setCopiedReferral] = useState(false);
   const [referralStats, setReferralStats] = useState<any>(null);

   useEffect(() => {
      const loadData = async () => {
         setIsLoading(true);
         try {
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
            const { orders: orderData } = await orderApi.getUserOrders();
            // @ts-ignore
            setOrders(orderData);
         } catch (err) {
            console.error('Failed to load profile:', err);
         } finally {
            setIsLoading(false);
         }
      };
      if (user) loadData();
      else navigate('/auth');
   }, [user, navigate]);

   // Load referral data when REFERRALS tab is active
   useEffect(() => {
      const loadReferralData = async () => {
         if (activeTab === 'REFERRALS' && user) {
            try {
               const [codeData, statsData] = await Promise.all([
                  fetch('/api/users/referral/code', {
                     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                  }).then(r => r.json()),
                  fetch('/api/users/referral/stats', {
                     headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                  }).then(r => r.json())
               ]);
               setReferralData(codeData);
               setReferralStats(statsData);
            } catch (error) {
               console.error('Failed to load referral data:', error);
            }
         }
      };
      loadReferralData();
   }, [activeTab, user]);

   const handleLogout = () => { logout(); navigate('/'); };

   const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      setSuccessMsg('');
      try {
         if (phoneNumber !== profile.phoneNumber) {
            await userApi.updateProfile({ phoneNumber });
         }
         if (defaultAddress.address && defaultAddress.city) {
            await userApi.addAddress({ ...defaultAddress, type: 'SHIPPING', isDefault: true });
            const { user: updatedProfile } = await userApi.getProfile();
            setAddresses(updatedProfile.addresses);
         }
         setSuccessMsg('Saved');
         setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
         console.error(err);
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
      } catch (err) { console.error(err); }
   };

   const handleDeleteAddress = async (id: string) => {
      if (!confirm('Delete address?')) return;
      try {
         await userApi.deleteAddress(id);
         setAddresses(prev => prev.filter(a => a.id !== id));
      } catch (err) { console.error(err); }
   };

   if (isLoading) return <div className="min-h-screen bg-void flex items-center justify-center text-tangerine font-mono text-xs uppercase tracking-widest">Loading...</div>;

   return (
      <div className="min-h-screen pt-32 pb-20 bg-void text-pearl px-6 relative overflow-hidden">
         <ParticleSystem />

         <div className="max-w-6xl mx-auto relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 border-b border-pearl/10 pb-8 gap-6">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-charcoal border border-pearl/20 flex items-center justify-center font-display text-4xl text-tangerine">
                     {profile?.fullName?.substring(0, 2).toUpperCase() || 'US'}
                  </div>
                  <div>
                     <h1 className="font-display text-4xl text-pearl">{profile?.fullName}</h1>
                     <p className="text-warm-gray font-mono text-xs mt-1 flex items-center gap-2">
                        <span className="uppercase tracking-widest">{profile?.role}</span>
                        <span className="text-tangerine">•</span>
                        <span>{profile?.email}</span>
                     </p>
                  </div>
               </div>
               <button onClick={handleLogout} className="text-warm-gray hover:text-red-500 uppercase tracking-widest text-xs font-bold border border-pearl/10 px-6 py-3 hover:border-red-500/50 transition-all flex items-center gap-2">
                  <LogOut size={14} /> Disconnect
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               {/* Sidebar */}
               <div className="lg:col-span-3 space-y-1">
                  {[
                     { id: 'SETTINGS', icon: User, label: 'Settings' },
                     { id: 'ORDERS', icon: Package, label: 'Orders' },
                     { id: 'ADDRESSES', icon: MapPin, label: 'Addresses' },
                     { id: 'REFERRALS', icon: Gift, label: 'Referrals' },
                  ].map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn("w-full text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 border-l-2", activeTab === tab.id ? "border-tangerine bg-charcoal/50 text-white" : "border-transparent text-warm-gray hover:text-pearl hover:bg-white/5")}
                     >
                        <tab.icon size={14} /> {tab.label}
                     </button>
                  ))}
               </div>

               {/* Content */}
               <div className="lg:col-span-9 min-h-[500px]">
                  <AnimatePresence mode="wait">

                     {/* SETTINGS */}
                     {activeTab === 'SETTINGS' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-12">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-6">
                                 <h3 className="font-display text-2xl text-pearl">Personal Information</h3>
                                 <div className="space-y-4">
                                    <div className="group">
                                       <label className="block text-[10px] uppercase tracking-widest text-warm-gray mb-2">Full Name</label>
                                       <input disabled value={profile?.fullName || ''} className="w-full bg-charcoal border border-pearl/10 p-4 text-sm text-pearl font-mono opacity-50 cursor-not-allowed" />
                                    </div>
                                    <div className="group">
                                       <label className="block text-[10px] uppercase tracking-widest text-warm-gray mb-2">Email Address</label>
                                       <input disabled value={profile?.email || ''} className="w-full bg-charcoal border border-pearl/10 p-4 text-sm text-pearl font-mono opacity-50 cursor-not-allowed" />
                                    </div>
                                    <div className="group">
                                       <label className="block text-[10px] uppercase tracking-widest text-warm-gray mb-2">Phone Number</label>
                                       <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-void border border-pearl/20 p-4 text-sm text-pearl font-mono focus:border-tangerine outline-none transition-colors" placeholder="+92..." />
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-6">
                                 <h3 className="font-display text-2xl text-pearl">Primary Shipping</h3>
                                 <div className="space-y-4">
                                    {['address', 'city', 'zipCode'].map(field => (
                                       <div key={field}>
                                          <input
                                             // @ts-ignore
                                             value={defaultAddress[field]}
                                             // @ts-ignore
                                             onChange={e => setDefaultAddress({ ...defaultAddress, [field]: e.target.value })}
                                             placeholder={field.toUpperCase()}
                                             className="w-full bg-void border border-pearl/20 p-4 text-sm text-pearl font-mono focus:border-tangerine outline-none transition-colors"
                                          />
                                       </div>
                                    ))}
                                    <select
                                       value={defaultAddress.country}
                                       onChange={(e) => setDefaultAddress({ ...defaultAddress, country: e.target.value })}
                                       className="w-full bg-void border border-pearl/20 p-4 text-sm text-pearl font-mono focus:border-tangerine outline-none"
                                    >
                                       <option value="Pakistan">Pakistan</option>
                                       <option value="UAE">UAE</option>
                                       <option value="UK">UK</option>
                                       <option value="USA">USA</option>
                                    </select>
                                 </div>
                              </div>
                           </div>

                           <div className="pt-8 border-t border-pearl/10 flex justify-end">
                              <button onClick={handleUpdateProfile} disabled={isSaving} className="bg-tangerine hover:bg-white text-void px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2">
                                 {isSaving ? 'Saving...' : 'Save Changes'}
                              </button>
                           </div>
                           {successMsg && <p className="text-right text-green-500 font-mono text-xs mt-2 uppercase tracking-widest">{successMsg}</p>}
                        </motion.div>
                     )}

                     {/* ORDERS */}
                     {activeTab === 'ORDERS' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                           <h2 className="font-display text-3xl text-pearl mb-8">Collection History ({orders.length})</h2>
                           {orders.length === 0 ? (
                              <div className="border border-dashed border-pearl/20 p-12 text-center text-warm-gray">
                                 <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                 <p className="font-mono text-xs uppercase tracking-widest">No acquisitions yet</p>
                              </div>
                           ) : (
                              orders.map((order: any) => (
                                 <div key={order.id} className="bg-charcoal/30 border border-pearl/10 p-6 flex flex-col md:flex-row gap-6 hover:border-tangerine/30 transition-colors group">
                                    <div className="flex-1 space-y-4">
                                       <div className="flex items-center gap-4">
                                          <span className="font-mono text-tangerine text-lg">#{order.id.slice(0, 8)}</span>
                                          <span className={cn("text-[10px] uppercase tracking-widest px-2 py-1 border",
                                             order.status === 'DELIVERED' ? "border-green-500/30 text-green-400 bg-green-500/5" :
                                                "border-pearl/20 text-warm-gray"
                                          )}>{order.status}</span>
                                       </div>
                                       <div className="flex gap-2">
                                          {order.items.map((item: any, i: number) => (
                                             item.artwork?.imageUrl && <img key={i} src={item.artwork.imageUrl} className="w-12 h-12 object-cover border border-pearl/10 grayscale group-hover:grayscale-0 transition-all" />
                                          ))}
                                       </div>
                                    </div>
                                    <div className="text-right flex flex-col justify-between">
                                       <p className="font-display text-2xl text-pearl">{formatCurrency(order.totalAmount)}</p>
                                       <p className="text-warm-gray text-[10px] uppercase tracking-widest mb-2">{new Date(order.createdAt).toLocaleDateString()}</p>
                                       <Link to={`/invoice/${order.id}`} target="_blank" className="text-tangerine hover:text-white text-[10px] uppercase tracking-widest font-bold">
                                          View Invoice →
                                       </Link>
                                    </div>
                                 </div>
                              ))
                           )}
                        </motion.div>
                     )}

                     {/* ADDRESSES */}
                     {activeTab === 'ADDRESSES' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                           <div className="flex justify-between items-center mb-8">
                              <h2 className="font-display text-3xl text-pearl">Address Book</h2>
                              <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-tangerine hover:text-white text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                                 <Plus size={14} /> Add New
                              </button>
                           </div>

                           {showAddressForm && (
                              <form onSubmit={handleAddAddress} className="bg-charcoal/50 border border-tangerine/30 p-8 mb-8 grid grid-cols-2 gap-4">
                                 <input placeholder="Address" value={newAddress.address} onChange={e => setNewAddress({ ...newAddress, address: e.target.value })} className="col-span-2 bg-void border border-pearl/20 p-3 text-xs text-pearl" />
                                 <input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="bg-void border border-pearl/20 p-3 text-xs text-pearl" />
                                 <input placeholder="Zip" value={newAddress.zipCode} onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })} className="bg-void border border-pearl/20 p-3 text-xs text-pearl" />
                                 <button className="col-span-2 bg-tangerine text-void font-bold uppercase text-xs py-3 mt-2">Save Address</button>
                              </form>
                           )}

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {addresses.map(addr => (
                                 <div key={addr.id} className={cn("p-6 border relative group", addr.isDefault ? "border-tangerine bg-tangerine/5" : "border-pearl/10 bg-charcoal/30")}>
                                    {addr.isDefault && <span className="absolute top-4 right-4 text-[10px] text-tangerine uppercase tracking-widest border border-tangerine px-2">Default</span>}
                                    <p className="text-pearl font-mono text-sm leading-relaxed">{addr.address}</p>
                                    <p className="text-warm-gray text-xs mt-2 uppercase">{addr.city}, {addr.country}</p>
                                    {!addr.isDefault && (
                                       <button onClick={() => handleDeleteAddress(addr.id)} className="absolute bottom-4 right-4 text-warm-gray hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Trash2 size={14} />
                                       </button>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </motion.div>
                     )}

                     {/* REFERRALS */}
                     {activeTab === 'REFERRALS' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                           {referralData?.programEnabled === false ? (
                              <div className="text-center py-16 space-y-4">
                                 <Gift className="w-16 h-16 text-warm-gray/30 mx-auto" />
                                 <h3 className="font-display text-xl text-pearl">Referral Program Inactive</h3>
                                 <p className="text-warm-gray text-sm">The referral program is currently not available. Check back later!</p>
                              </div>
                           ) : (
                           <>
                           <div>
                              <h3 className="font-display text-2xl text-pearl mb-2">Referral Program</h3>
                              <p className="text-warm-gray text-sm">Share Muraqqa with friends and earn rewards</p>
                           </div>

                           {referralData ? (
                              <div className="space-y-6">
                                 {/* Referral Code Card */}
                                 <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-8">
                                    <div className="flex items-center justify-between mb-6">
                                       <div>
                                          <p className="text-xs uppercase tracking-widest text-warm-gray mb-2">Your Referral Code</p>
                                          <div className="font-display text-4xl text-amber-500 tracking-wider">
                                             {referralData.referralCode || 'Loading...'}
                                          </div>
                                       </div>
                                       <Gift className="w-16 h-16 text-amber-500/30" />
                                    </div>

                                    <div className="space-y-3">
                                       <div className="flex gap-2">
                                          <input
                                             type="text"
                                             value={referralData.referralUrl || ''}
                                             readOnly
                                             className="flex-1 bg-void border border-pearl/20 p-3 text-sm text-pearl font-mono rounded"
                                          />
                                          <button
                                             onClick={() => {
                                                navigator.clipboard.writeText(referralData.referralUrl);
                                                setCopiedReferral(true);
                                                setTimeout(() => setCopiedReferral(false), 2000);
                                             }}
                                             className="px-6 py-3 bg-amber-500 text-void font-bold uppercase tracking-widest text-xs hover:bg-amber-600 transition-colors rounded flex items-center gap-2"
                                          >
                                             {copiedReferral ? (
                                                <>
                                                   <CheckCircle size={16} />
                                                   Copied!
                                                </>
                                             ) : (
                                                <>
                                                   <Copy size={16} />
                                                   Copy Link
                                                </>
                                             )}
                                          </button>
                                       </div>
                                       <p className="text-xs text-warm-gray">
                                          Share this link with friends. When they sign up using your code, you'll both get rewards!
                                       </p>
                                    </div>
                                 </div>

                                 {/* Stats Cards */}
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-charcoal/50 border border-pearl/10 rounded-lg p-6">
                                       <Users className="w-8 h-8 text-tangerine mb-3" />
                                       <div className="text-3xl font-display text-pearl mb-1">
                                          {referralData.referralCount || 0}
                                       </div>
                                       <p className="text-xs uppercase tracking-widest text-warm-gray">Referrals</p>
                                    </div>

                                    <div className="bg-charcoal/50 border border-pearl/10 rounded-lg p-6">
                                       <Gift className="w-8 h-8 text-green-500 mb-3" />
                                       <div className="text-3xl font-display text-pearl mb-1">
                                          PKR 0
                                       </div>
                                       <p className="text-xs uppercase tracking-widest text-warm-gray">Earned</p>
                                    </div>

                                    <div className="bg-charcoal/50 border border-pearl/10 rounded-lg p-6">
                                       <CheckCircle className="w-8 h-8 text-blue-500 mb-3" />
                                       <div className="text-3xl font-display text-pearl mb-1">
                                          {referralData.wasReferred ? 'Yes' : 'No'}
                                       </div>
                                       <p className="text-xs uppercase tracking-widest text-warm-gray">You Were Referred</p>
                                    </div>
                                 </div>

                                 {/* Referral List */}
                                 {referralStats && referralStats.referrals && referralStats.referrals.length > 0 && (
                                    <div>
                                       <h4 className="font-display text-xl text-pearl mb-4">Your Referrals</h4>
                                       <div className="space-y-2">
                                          {referralStats.referrals.map((ref: any) => (
                                             <div key={ref.id} className="bg-charcoal/30 border border-pearl/10 rounded p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                   <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 font-bold">
                                                      {ref.fullName?.charAt(0) || 'U'}
                                                   </div>
                                                   <div>
                                                      <div className="text-pearl font-medium">{ref.fullName}</div>
                                                      <div className="text-xs text-warm-gray">{ref.email}</div>
                                                   </div>
                                                </div>
                                                <div className="text-xs text-warm-gray font-mono">
                                                   {new Date(ref.createdAt).toLocaleDateString()}
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 )}

                                 {/* How it Works */}
                                 <div className="bg-charcoal/20 border border-pearl/10 rounded-lg p-6">
                                    <h4 className="font-display text-lg text-pearl mb-4">How It Works</h4>
                                    <div className="space-y-3 text-sm text-warm-gray">
                                       <div className="flex gap-3">
                                          <span className="flex-shrink-0 w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 font-bold text-xs">1</span>
                                          <p>Share your unique referral link with friends and art enthusiasts</p>
                                       </div>
                                       <div className="flex gap-3">
                                          <span className="flex-shrink-0 w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 font-bold text-xs">2</span>
                                          <p>When they sign up using your link, they become your referral</p>
                                       </div>
                                       <div className="flex gap-3">
                                          <span className="flex-shrink-0 w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 font-bold text-xs">3</span>
                                          <p>Both you and your friend receive exclusive benefits and discounts</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="text-center py-12">
                                 <div className="animate-pulse text-warm-gray">Loading referral data...</div>
                              </div>
                           )}
                           </>
                           )}
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </div>
         </div>
      </div>
   );
};
