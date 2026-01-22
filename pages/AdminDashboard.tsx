
import React, { useState } from 'react';
import {
   LayoutDashboard, Package, Users, DollarSign, Settings,
   Plus, Edit, Trash2, Truck, CreditCard, Check, X, Search,
   Video, Globe, MessageSquare, Save, Facebook, Instagram, Image as ImageIcon, Calendar
} from 'lucide-react';
import { useGallery } from '../context/GalleryContext';
import { useCurrency } from '../App';
import { OrderStatus, Artwork, Conversation } from '../types';
import { uploadApi } from '../services/api';

export const AdminDashboard: React.FC = () => {
   const {
      artworks, orders, shippingConfig, totalRevenue, stripeConnected, conversations, siteContent, exhibitions,
      addArtwork, updateArtwork, deleteArtwork, updateOrderStatus, updateShippingConfig, connectStripe,
      addConversation, deleteConversation, updateSiteContent, addExhibition, deleteExhibition
   } = useGallery();
   const { convertPrice } = useCurrency();
   const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVENTORY' | 'ORDERS' | 'SHIPPING' | 'FINANCE' | 'CONTENT' | 'EXHIBITIONS'>('OVERVIEW');

   // Local State for Artworks
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [newArtwork, setNewArtwork] = useState<Partial<Artwork>>({
      title: '', artistName: '', price: 0, category: 'Abstract', medium: '', inStock: true,
      year: new Date().getFullYear(), dimensions: '', description: ''
   });

   // Local State for Conversations
   const [isConvModalOpen, setIsConvModalOpen] = useState(false);
   const [newConv, setNewConv] = useState<Partial<Conversation>>({
      title: '', subtitle: '', category: 'WATCH', description: '', videoId: '', duration: '', location: ''
   });

   // Local State for Exhibitions
   const [isExhModalOpen, setIsExhModalOpen] = useState(false);
   const [newExh, setNewExh] = useState({
      title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '', isVirtual: false, status: 'UPCOMING'
   });

   // Local State for Order Tracking
   const [trackingInput, setTrackingInput] = useState<{ id: string, code: string } | null>(null);

   // Content form states
   const [heroForm, setHeroForm] = useState(siteContent);
   const [isUploading, setIsUploading] = useState(false);

   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
         alert('Please upload an image file');
         return;
      }

      if (file.size > 5 * 1024 * 1024) {
         alert('File size must be less than 5MB');
         return;
      }

      try {
         setIsUploading(true);
         const url = await uploadApi.uploadImage(file);
         setNewArtwork(prev => ({ ...prev, imageUrl: url }));
      } catch (error) {
         console.error('Upload failed:', error);
         alert('Failed to upload image. Please try again.');
      } finally {
         setIsUploading(false);
      }
   };

   const handleAddArtwork = async () => {
      if (!newArtwork.title || !newArtwork.price) return;
      try {
         await addArtwork({
            ...newArtwork,
            imageUrl: newArtwork.imageUrl || `https://picsum.photos/800/800?random=${Date.now()}`,
            year: new Date().getFullYear(),
            dimensions: '24x24'
         } as any);
         setIsAddModalOpen(false);
         setNewArtwork({
            title: '', artistName: '', price: 0, category: 'Abstract', medium: '', inStock: true,
            year: new Date().getFullYear(), dimensions: '', description: '', imageUrl: ''
         });
      } catch (err) {
         alert('Failed to add artwork');
      }
   };

   const handleAddConversation = async () => {
      if (!newConv.title || !newConv.videoId) return;
      try {
         await addConversation({
            ...newConv,
            thumbnailUrl: `https://picsum.photos/800/500?random=${Date.now()}`
         });
         setIsConvModalOpen(false);
         setNewConv({ title: '', subtitle: '', category: 'WATCH', description: '', videoId: '', duration: '', location: '' });
      } catch (err) {
         alert('Failed to add conversation');
      }
   };

   const handleAddExhibition = async () => {
      if (!newExh.title || !newExh.startDate) return;
      try {
         await addExhibition({
            ...newExh,
            imageUrl: newExh.imageUrl || `https://picsum.photos/800/600?random=${Date.now()}`
         });
         setIsExhModalOpen(false);
         setNewExh({ title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '', isVirtual: false, status: 'UPCOMING' });
      } catch (err) {
         alert('Failed to add exhibition');
      }
   };

   const handleSaveContent = async () => {
      try {
         await updateSiteContent(heroForm);
         alert('Site content updated successfully!');
      } catch (err) {
         alert('Failed to update site content');
      }
   };

   return (
      <div className="pt-24 px-4 sm:px-8 max-w-7xl mx-auto min-h-screen pb-12">

         {/* Header */}
         <div className="flex justify-between items-center mb-8 border-b border-stone-800 pb-6 overflow-x-auto">
            <div>
               <h1 className="text-3xl font-serif text-white">Gallery Management</h1>
               <p className="text-stone-500 text-sm mt-1">Administrator Portal</p>
            </div>
            <div className="flex gap-2">
               {['OVERVIEW', 'INVENTORY', 'ORDERS', 'SHIPPING', 'FINANCE', 'CONTENT', 'EXHIBITIONS'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`text-xs font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-amber-600 text-white' : 'bg-stone-900 text-stone-400 hover:text-white'}`}
                  >
                     {tab}
                  </button>
               ))}
            </div>
         </div>

         {/* OVERVIEW TAB */}
         {activeTab === 'OVERVIEW' && (
            <div className="space-y-8 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                     { icon: DollarSign, label: 'Total Revenue', val: convertPrice(totalRevenue) },
                     { icon: Users, label: 'Active Collectors', val: '143' },
                     { icon: Package, label: 'Artworks in Stock', val: artworks.filter(a => a.inStock).length.toString() },
                     { icon: Truck, label: 'Pending Shipments', val: orders.filter(o => o.status === 'PAID' || o.status === 'PROCESSING').length.toString() },
                  ].map((stat, i) => (
                     <div key={i} className="bg-stone-900 p-6 rounded-lg border border-stone-800">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-stone-400 text-sm uppercase tracking-wider">{stat.label}</span>
                           <stat.icon className="text-amber-500" size={20} />
                        </div>
                        <div className="text-2xl text-white font-serif">{stat.val}</div>
                     </div>
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-stone-900 p-6 border border-stone-800">
                     <h3 className="text-white font-serif text-xl mb-4">Recent Activity</h3>
                     <ul className="space-y-4 text-sm text-stone-400">
                        {orders.slice(0, 5).map(o => (
                           <li key={o.id} className="flex justify-between items-center border-b border-stone-800 pb-2">
                              <span>New order from <strong className="text-white">{o.customerName}</strong></span>
                              <span className="text-xs">{new Date(o.date).toLocaleDateString()}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="bg-stone-900 p-6 border border-stone-800 flex items-center justify-center flex-col">
                     <div className="text-center space-y-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${stripeConnected ? 'bg-green-900/20 text-green-500' : 'bg-stone-800 text-stone-500'}`}>
                           <CreditCard size={32} />
                        </div>
                        <h3 className="text-white font-serif text-xl">Payment Gateway</h3>
                        <p className="text-stone-500 text-sm">{stripeConnected ? 'Stripe Connect Active' : 'Setup Required'}</p>
                        {!stripeConnected && (
                           <button onClick={connectStripe} className="bg-white text-black px-6 py-2 text-xs uppercase font-bold hover:bg-stone-200">Connect Stripe</button>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* CONTENT TAB */}
         {activeTab === 'CONTENT' && (
            <div className="space-y-12 animate-fade-in">

               {/* Conversations Section */}
               <div>
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h3 className="text-xl text-white font-serif flex items-center gap-2"><Video size={20} className="text-amber-500" /> Conversations</h3>
                        <p className="text-stone-500 text-xs">Manage artist talks and video content.</p>
                     </div>
                     <button onClick={() => setIsConvModalOpen(true)} className="bg-stone-800 text-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-stone-700">
                        <Plus size={16} /> Add Video
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {conversations.map(conv => (
                        <div key={conv.id} className="bg-stone-900 border border-stone-800 p-4 relative group">
                           <button onClick={() => deleteConversation(conv.id)} className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={14} />
                           </button>
                           <div className="aspect-video bg-black mb-3">
                              <img src={conv.thumbnailUrl} className="w-full h-full object-cover opacity-60" />
                           </div>
                           <h4 className="text-white font-serif text-lg leading-tight mb-1">{conv.title}</h4>
                           <p className="text-stone-500 text-xs uppercase mb-2">{conv.category}</p>
                           <p className="text-stone-400 text-xs line-clamp-2">{conv.description}</p>
                        </div>
                     ))}
                  </div>

                  {/* Add Conversation Modal */}
                  {isConvModalOpen && (
                     <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-stone-900 border border-stone-700 p-6 w-full max-w-lg space-y-4">
                           <h3 className="text-white text-xl">Add New Conversation</h3>
                           <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white" placeholder="Title" value={newConv.title} onChange={e => setNewConv({ ...newConv, title: e.target.value })} />
                           <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white" placeholder="Subtitle" value={newConv.subtitle} onChange={e => setNewConv({ ...newConv, subtitle: e.target.value })} />
                           <div className="grid grid-cols-2 gap-4">
                              <select className="w-full bg-stone-950 border border-stone-700 p-2 text-white" value={newConv.category} onChange={e => setNewConv({ ...newConv, category: e.target.value as any })}>
                                 <option value="WATCH">Watch</option>
                                 <option value="LISTEN">Listen</option>
                                 <option value="LEARN">Learn</option>
                              </select>
                              <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white" placeholder="Duration (e.g. 10:25)" value={newConv.duration} onChange={e => setNewConv({ ...newConv, duration: e.target.value })} />
                           </div>
                           <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white" placeholder="YouTube Video ID" value={newConv.videoId} onChange={e => setNewConv({ ...newConv, videoId: e.target.value })} />
                           <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white" placeholder="Location" value={newConv.location} onChange={e => setNewConv({ ...newConv, location: e.target.value })} />
                           <textarea className="w-full bg-stone-950 border border-stone-700 p-2 text-white" placeholder="Description" rows={3} value={newConv.description} onChange={e => setNewConv({ ...newConv, description: e.target.value })} />

                           <div className="flex gap-2 pt-2">
                              <button onClick={handleAddConversation} className="flex-1 bg-amber-600 py-2 text-white">Add Content</button>
                              <button onClick={() => setIsConvModalOpen(false)} className="flex-1 bg-stone-800 py-2 text-white">Cancel</button>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               <div className="border-t border-stone-800 pt-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Site Content Form */}
                  <div className="space-y-6">
                     <h3 className="text-xl text-white font-serif flex items-center gap-2"><Globe size={20} className="text-amber-500" /> Front Page Content</h3>
                     <div className="bg-stone-900 border border-stone-800 p-6 space-y-4">
                        <div>
                           <label className="block text-stone-500 text-xs uppercase mb-1">Hero Title</label>
                           <input
                              type="text"
                              value={heroForm.heroTitle}
                              onChange={e => setHeroForm({ ...heroForm, heroTitle: e.target.value })}
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                           />
                        </div>
                        <div>
                           <label className="block text-stone-500 text-xs uppercase mb-1">Hero Subtitle</label>
                           <input
                              type="text"
                              value={heroForm.heroSubtitle}
                              onChange={e => setHeroForm({ ...heroForm, heroSubtitle: e.target.value })}
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                           />
                        </div>
                        <button onClick={handleSaveContent} className="bg-amber-600 text-white px-6 py-2 text-sm flex items-center gap-2 hover:bg-amber-500">
                           <Save size={16} /> Save Changes
                        </button>
                     </div>
                  </div>

                  {/* Social Media Form */}
                  <div className="space-y-6">
                     <h3 className="text-xl text-white font-serif flex items-center gap-2"><MessageSquare size={20} className="text-amber-500" /> Social Media & Connectivity</h3>
                     <div className="bg-stone-900 border border-stone-800 p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-stone-500 text-xs uppercase mb-1">Instagram URL</label>
                              <input
                                 type="text"
                                 value={heroForm.socialLinks.instagram}
                                 onChange={e => setHeroForm({ ...heroForm, socialLinks: { ...heroForm.socialLinks, instagram: e.target.value } })}
                                 className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-xs"
                              />
                           </div>
                           <div>
                              <label className="block text-stone-500 text-xs uppercase mb-1">Facebook URL</label>
                              <input
                                 type="text"
                                 value={heroForm.socialLinks.facebook}
                                 onChange={e => setHeroForm({ ...heroForm, socialLinks: { ...heroForm.socialLinks, facebook: e.target.value } })}
                                 className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-xs"
                              />
                           </div>
                           <div>
                              <label className="block text-stone-500 text-xs uppercase mb-1">Twitter URL</label>
                              <input
                                 type="text"
                                 value={heroForm.socialLinks.twitter}
                                 onChange={e => setHeroForm({ ...heroForm, socialLinks: { ...heroForm.socialLinks, twitter: e.target.value } })}
                                 className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-xs"
                              />
                           </div>
                           <div>
                              <label className="block text-stone-500 text-xs uppercase mb-1">Pinterest URL</label>
                              <input
                                 type="text"
                                 value={heroForm.socialLinks.pinterest}
                                 onChange={e => setHeroForm({ ...heroForm, socialLinks: { ...heroForm.socialLinks, pinterest: e.target.value } })}
                                 className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-xs"
                              />
                           </div>
                        </div>

                        <div className="pt-4 border-t border-stone-800">
                           <h4 className="text-white text-sm font-bold mb-3">API Credentials</h4>
                           <div className="space-y-3">
                              <div>
                                 <label className="block text-stone-500 text-xs uppercase mb-1">Facebook App ID</label>
                                 <input
                                    type="password"
                                    placeholder="APP-ID-123456"
                                    value={heroForm.socialApiKeys?.facebookAppId || ''}
                                    onChange={e => setHeroForm({ ...heroForm, socialApiKeys: { ...heroForm.socialApiKeys, facebookAppId: e.target.value } })}
                                    className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-xs font-mono"
                                 />
                              </div>
                              <div>
                                 <label className="block text-stone-500 text-xs uppercase mb-1">Instagram Client ID</label>
                                 <input
                                    type="password"
                                    placeholder="CLIENT-ID-7890"
                                    value={heroForm.socialApiKeys?.instagramClientId || ''}
                                    onChange={e => setHeroForm({ ...heroForm, socialApiKeys: { ...heroForm.socialApiKeys, instagramClientId: e.target.value } })}
                                    className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-xs font-mono"
                                 />
                              </div>
                           </div>
                        </div>

                        <button onClick={handleSaveContent} className="bg-amber-600 text-white px-6 py-2 text-sm flex items-center gap-2 hover:bg-amber-500 w-full justify-center">
                           <Save size={16} /> Save Connectivity Settings
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* INVENTORY TAB */}
         {activeTab === 'INVENTORY' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl text-white font-serif">Artwork Catalog</h3>
                  <button onClick={() => setIsAddModalOpen(true)} className="bg-amber-600 text-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-amber-500">
                     <Plus size={16} /> Add Artwork
                  </button>
               </div>

               {/* Add Modal */}
               {isAddModalOpen && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                     <div className="bg-stone-900 border border-stone-700 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-6">
                        <h3 className="text-white text-xl border-b border-stone-800 pb-4">Add New Masterpiece</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {/* Left Column: Form Fields */}
                           <div className="space-y-4">
                              <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-sm" placeholder="Title" value={newArtwork.title} onChange={e => setNewArtwork({ ...newArtwork, title: e.target.value })} />
                              <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-sm" placeholder="Artist Name" value={newArtwork.artistName} onChange={e => setNewArtwork({ ...newArtwork, artistName: e.target.value })} />

                              <div className="grid grid-cols-2 gap-4">
                                 <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-sm" type="number" placeholder="Price (PKR)" value={newArtwork.price || ''} onChange={e => setNewArtwork({ ...newArtwork, price: Number(e.target.value) })} />
                                 <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-sm" type="number" placeholder="Year" value={newArtwork.year} onChange={e => setNewArtwork({ ...newArtwork, year: Number(e.target.value) })} />
                              </div>

                              <select className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-sm" value={newArtwork.category} onChange={e => setNewArtwork({ ...newArtwork, category: e.target.value as any })}>
                                 <option value="Abstract">Abstract</option>
                                 <option value="Calligraphy">Calligraphy</option>
                                 <option value="Landscape">Landscape</option>
                                 <option value="Miniature">Miniature</option>
                                 <option value="Portrait">Portrait</option>
                              </select>

                              <div className="grid grid-cols-2 gap-4">
                                 <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-sm" placeholder="Medium (e.g. Oil on Canvas)" value={newArtwork.medium} onChange={e => setNewArtwork({ ...newArtwork, medium: e.target.value })} />
                                 <input className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-sm" placeholder="Dimensions (e.g. 24x36)" value={newArtwork.dimensions} onChange={e => setNewArtwork({ ...newArtwork, dimensions: e.target.value })} />
                              </div>
                           </div>

                           {/* Right Column: Compact Image Upload */}
                           <div>
                              <div className="h-full w-full bg-stone-950 border border-stone-700 flex flex-col items-center justify-center overflow-hidden relative group min-h-[200px]">
                                 {newArtwork.imageUrl ? (
                                    <>
                                       <img src={newArtwork.imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm border border-white/20">
                                             Change
                                             <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                          </label>
                                       </div>
                                    </>
                                 ) : (
                                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-stone-800 transition-colors">
                                       {isUploading ? (
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-2"></div>
                                       ) : (
                                          <ImageIcon className="mx-auto mb-2 opacity-50 text-stone-600" size={32} />
                                       )}
                                       <span className="text-xs text-stone-500">{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                                       <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                 )}
                              </div>
                              <p className="text-[10px] text-stone-600 mt-2 text-center">JPG, PNG, WEBP (Max 5MB)</p>
                           </div>
                        </div>

                        <textarea className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-sm" rows={3} placeholder="Artwork Description..." value={newArtwork.description} onChange={e => setNewArtwork({ ...newArtwork, description: e.target.value })} />

                        <div className="flex gap-2">
                           <button onClick={handleAddArtwork} className="flex-1 bg-amber-600 py-2 text-white">Save</button>
                           <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-stone-800 py-2 text-white">Cancel</button>
                        </div>
                     </div>
                  </div>
               )}

               <div className="bg-stone-900 border border-stone-800 overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-400">
                     <thead className="bg-stone-950 text-stone-500 uppercase text-xs border-b border-stone-800">
                        <tr>
                           <th className="p-4">Artwork</th>
                           <th className="p-4">Artist</th>
                           <th className="p-4">Price</th>
                           <th className="p-4">Status</th>
                           <th className="p-4">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-stone-800">
                        {artworks.map(art => (
                           <tr key={art.id} className="hover:bg-stone-800/30">
                              <td className="p-4 flex items-center gap-3">
                                 <img src={art.imageUrl} className="w-10 h-10 object-cover rounded" alt="" />
                                 <span className="text-white font-medium">{art.title}</span>
                              </td>
                              <td className="p-4">{art.artistName}</td>
                              <td className="p-4">{convertPrice(art.price)}</td>
                              <td className="p-4">
                                 <button
                                    onClick={() => updateArtwork(art.id, { inStock: !art.inStock })}
                                    className={`px-2 py-1 text-xs rounded ${art.inStock ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}
                                 >
                                    {art.inStock ? 'In Stock' : 'Sold Out'}
                                 </button>
                              </td>
                              <td className="p-4 flex gap-2">
                                 <button className="text-stone-500 hover:text-white"><Edit size={16} /></button>
                                 <button onClick={() => deleteArtwork(art.id)} className="text-stone-500 hover:text-red-500"><Trash2 size={16} /></button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* ORDERS TAB */}
         {activeTab === 'ORDERS' && (
            <div className="space-y-6 animate-fade-in">
               <h3 className="text-xl text-white font-serif">Order Management</h3>
               <div className="bg-stone-900 border border-stone-800 overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-400">
                     <thead className="bg-stone-950 text-stone-500 uppercase text-xs border-b border-stone-800">
                        <tr>
                           <th className="p-4">Order ID</th>
                           <th className="p-4">Customer</th>
                           <th className="p-4">Total</th>
                           <th className="p-4">Payment</th>
                           <th className="p-4">Status</th>
                           <th className="p-4">Fulfillment</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-stone-800">
                        {orders.map(order => (
                           <tr key={order.id} className="hover:bg-stone-800/30">
                              <td className="p-4 font-mono text-white">{order.id}</td>
                              <td className="p-4">
                                 <div className="text-white">{order.customerName}</div>
                                 <div className="text-xs">{order.shippingCountry}</div>
                              </td>
                              <td className="p-4">{convertPrice(order.totalAmount)}</td>
                              <td className="p-4">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white">{order.paymentMethod}</span>
                                    {order.transactionId && <span className="text-[10px] font-mono text-stone-500">{order.transactionId}</span>}
                                 </div>
                              </td>
                              <td className="p-4">
                                 <select
                                    value={order.status}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                    className="bg-stone-950 border border-stone-700 text-xs text-white p-1 rounded"
                                 >
                                    {['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
                                       <option key={s} value={s}>{s}</option>
                                    ))}
                                 </select>
                              </td>
                              <td className="p-4">
                                 {order.trackingNumber ? (
                                    <span className="text-green-500 text-xs flex items-center gap-1"><Truck size={12} /> {order.trackingNumber}</span>
                                 ) : (
                                    trackingInput?.id === order.id ? (
                                       <div className="flex gap-1">
                                          <input
                                             className="w-24 bg-stone-950 text-white text-xs p-1 border border-stone-600"
                                             placeholder="Tracking #"
                                             value={trackingInput.code}
                                             onChange={e => setTrackingInput({ id: order.id, code: e.target.value })}
                                          />
                                          <button onClick={() => { updateOrderStatus(order.id, 'SHIPPED', trackingInput.code); setTrackingInput(null); }} className="text-green-500"><Check size={16} /></button>
                                          <button onClick={() => setTrackingInput(null)} className="text-red-500"><X size={16} /></button>
                                       </div>
                                    ) : (
                                       <button onClick={() => setTrackingInput({ id: order.id, code: '' })} className="text-amber-500 text-xs hover:underline">Add Tracking</button>
                                    )
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* FINANCE / STRIPE TAB */}
         {activeTab === 'FINANCE' && (
            <div className="space-y-6 animate-fade-in">
               <h3 className="text-xl text-white font-serif">Financial Overview</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-stone-900 p-6 border border-stone-800">
                     <h4 className="text-stone-500 text-xs uppercase tracking-widest mb-4">Stripe Connection</h4>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${stripeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                           <span className="text-white text-lg">{stripeConnected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                        {!stripeConnected && <button onClick={connectStripe} className="text-amber-500 text-sm hover:underline">Connect Now</button>}
                     </div>
                     {stripeConnected && (
                        <div className="mt-6 space-y-2">
                           <div className="flex justify-between text-sm text-stone-400"><span>Account ID</span><span className="font-mono text-white">acct_1Muraqqa8291</span></div>
                           <div className="flex justify-between text-sm text-stone-400"><span>Payout Schedule</span><span className="text-white">Daily</span></div>
                        </div>
                     )}
                  </div>

                  <div className="bg-stone-900 p-6 border border-stone-800">
                     <h4 className="text-stone-500 text-xs uppercase tracking-widest mb-4">Next Payout</h4>
                     <div className="text-4xl text-white font-serif mb-2">PKR 1,250,000</div>
                     <p className="text-stone-500 text-sm">Scheduled for Oct 25, 2024</p>
                     <button className="mt-6 w-full bg-stone-800 text-white py-2 text-sm hover:bg-stone-700">View Transactions</button>
                  </div>
               </div>
            </div>
         )}

         {/* SHIPPING TAB */}
         {activeTab === 'SHIPPING' && (
            <div className="space-y-6 animate-fade-in">
               <h3 className="text-xl text-white font-serif">Shipping Configuration</h3>
               <div className="bg-stone-900 p-8 border border-stone-800 max-w-2xl">
                  <div className="flex items-center justify-between mb-8">
                     <span className="text-white text-lg flex items-center gap-2"><Truck className="text-amber-500" /> DHL Integration</span>
                     <div
                        onClick={() => updateShippingConfig({ enableDHL: !shippingConfig.enableDHL })}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${shippingConfig.enableDHL ? 'bg-amber-600' : 'bg-stone-700'}`}
                     >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${shippingConfig.enableDHL ? 'translate-x-6' : ''}`}></div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <label className="block text-stone-500 text-xs uppercase mb-2">DHL API Key</label>
                        <input
                           type="password"
                           value={shippingConfig.dhlApiKey}
                           onChange={(e) => updateShippingConfig({ dhlApiKey: e.target.value })}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white font-mono"
                           disabled={!shippingConfig.enableDHL}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="block text-stone-500 text-xs uppercase mb-2">Flat Rate (Domestic)</label>
                           <input
                              type="number"
                              value={shippingConfig.domesticRate}
                              onChange={(e) => updateShippingConfig({ domesticRate: Number(e.target.value) })}
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                           />
                        </div>
                        <div>
                           <label className="block text-stone-500 text-xs uppercase mb-2">Flat Rate (Intl)</label>
                           <input
                              type="number"
                              value={shippingConfig.internationalRate}
                              onChange={(e) => updateShippingConfig({ internationalRate: Number(e.target.value) })}
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}


         {/* EXHIBITIONS TAB */}
         {activeTab === 'EXHIBITIONS' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl text-white font-serif">Exhibitions Management</h3>
                  <button onClick={() => setIsExhModalOpen(true)} className="bg-amber-600 text-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-amber-500">
                     <Plus size={16} /> Add Exhibition
                  </button>
               </div>

               {isExhModalOpen && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                     <div className="bg-stone-900 border border-stone-700 w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xl text-white font-serif">Add New Exhibition</h3>
                           <button onClick={() => setIsExhModalOpen(false)}><X className="text-stone-500 hover:text-white" /></button>
                        </div>
                        <div className="space-y-4">
                           <input
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                              placeholder="Exhibition Title"
                              value={newExh.title}
                              onChange={e => setNewExh({ ...newExh, title: e.target.value })}
                           />
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-xs text-stone-500 mb-1 block">Start Date</label>
                                 <input
                                    type="date"
                                    className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                                    value={newExh.startDate}
                                    onChange={e => setNewExh({ ...newExh, startDate: e.target.value })}
                                 />
                              </div>
                              <div>
                                 <label className="text-xs text-stone-500 mb-1 block">End Date (Optional)</label>
                                 <input
                                    type="date"
                                    className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                                    value={newExh.endDate}
                                    onChange={e => setNewExh({ ...newExh, endDate: e.target.value })}
                                 />
                              </div>
                           </div>
                           <input
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                              placeholder="Location"
                              value={newExh.location}
                              onChange={e => setNewExh({ ...newExh, location: e.target.value })}
                           />
                           <input
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                              placeholder="Image URL"
                              value={newExh.imageUrl}
                              onChange={e => setNewExh({ ...newExh, imageUrl: e.target.value })}
                           />
                           <div className="flex items-center gap-3">
                              <input
                                 type="checkbox"
                                 id="isVirtual"
                                 checked={newExh.isVirtual}
                                 onChange={e => setNewExh({ ...newExh, isVirtual: e.target.checked })}
                                 className="accent-amber-600 w-4 h-4"
                              />
                              <label htmlFor="isVirtual" className="text-stone-400">Virtual Tour Available</label>
                           </div>
                           <select
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                              value={newExh.status}
                              onChange={e => setNewExh({ ...newExh, status: e.target.value })}
                           >
                              <option value="UPCOMING">Upcoming</option>
                              <option value="CURRENT">Current</option>
                              <option value="PAST">Past</option>
                           </select>
                           <textarea
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white"
                              rows={4}
                              placeholder="Description"
                              value={newExh.description}
                              onChange={e => setNewExh({ ...newExh, description: e.target.value })}
                           />
                           <button onClick={handleAddExhibition} className="w-full bg-amber-600 text-white py-3 hover:bg-amber-500 font-bold">
                              Publish Exhibition
                           </button>
                        </div>
                     </div>
                  </div>
               )}

               <div className="grid grid-cols-1 gap-6">
                  {exhibitions.map((ex: any) => (
                     <div key={ex.id} className="bg-stone-900 p-6 border border-stone-800 flex justify-between items-center group">
                        <div className="flex gap-4">
                           <div className="w-24 h-16 bg-stone-800 overflow-hidden">
                              <img src={ex.imageUrl} alt={ex.title} className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <h4 className="text-white font-serif text-lg">{ex.title}</h4>
                              <p className="text-stone-500 text-sm">{ex.location} • {new Date(ex.startDate).toLocaleDateString()}</p>
                              <span className={`text-xs px-2 py-0.5 mt-1 inline-block border ${ex.status === 'CURRENT' ? 'border-green-500 text-green-500' : 'border-stone-600 text-stone-500'}`}>{ex.status}</span>
                           </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => deleteExhibition(ex.id)} className="p-2 text-stone-500 hover:text-red-500 hover:bg-red-900/10 rounded"><Trash2 size={18} /></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>

   );
};
