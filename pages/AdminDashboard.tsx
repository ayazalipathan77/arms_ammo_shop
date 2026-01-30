import React, { useState, useEffect } from 'react';
import {
   LayoutDashboard, Package, Users, DollarSign, Settings,
   Plus, Edit, Trash2, Truck, CreditCard, Check, X, Search,
   Video, Globe, MessageSquare, Save, Facebook, Instagram, Image as ImageIcon, Calendar,
   UserCheck, UserX, Clock, Mail, Shield, AlertCircle, Loader2
} from 'lucide-react';
import { useGallery } from '../context/GalleryContext';
import { useCurrency } from '../App';
import { OrderStatus, Artwork, Conversation } from '../types';
import { uploadApi, adminApi, artistApi } from '../services/api';

export const AdminDashboard: React.FC = () => {
   const {
      artworks, orders, shippingConfig, stripeConnected, conversations, siteContent, exhibitions,
      addArtwork, updateArtwork, deleteArtwork, updateOrderStatus, updateShippingConfig, connectStripe,
      addConversation, deleteConversation, updateSiteContent, addExhibition, updateExhibition, deleteExhibition,
      landingPageContent, updateLandingPageContent, fetchArtworks
   } = useGallery();
   const { convertPrice } = useCurrency();
   const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVENTORY' | 'ORDERS' | 'SHIPPING' | 'FINANCE' | 'CONTENT' | 'EXHIBITIONS' | 'USERS' | 'LANDING PAGE'>('OVERVIEW');

   // Dashboard Stats
   const [stats, setStats] = useState<any>(null);
   const [recentOrders, setRecentOrders] = useState<any[]>([]);

   // Users State
   const [users, setUsers] = useState<any[]>([]);
   const [userSearch, setUserSearch] = useState('');
   const [userSubTab, setUserSubTab] = useState<'ALL' | 'COLLECTORS' | 'ARTISTS' | 'PENDING'>('ALL');
   const [pendingArtists, setPendingArtists] = useState<any[]>([]);
   const [isLoadingPending, setIsLoadingPending] = useState(false);
   const [approvingId, setApprovingId] = useState<string | null>(null);
   const [rejectingId, setRejectingId] = useState<string | null>(null);
   const [rejectReason, setRejectReason] = useState('');
   const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

   // Artists State
   const [artists, setArtists] = useState<any[]>([]);

   // Local State for Artworks
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [newArtwork, setNewArtwork] = useState<any>({
      title: '', artistId: '', artistName: '', price: 0, category: 'Abstract', medium: '', inStock: true,
      year: new Date().getFullYear(), dimensions: '', description: '', imageUrl: ''
   });

   // Local State for Conversations
   const [isConvModalOpen, setIsConvModalOpen] = useState(false);
   const [newConv, setNewConv] = useState<Partial<Conversation>>({
      title: '', subtitle: '', category: 'WATCH', description: '', videoId: '', duration: '', location: ''
   });

   // Local State for Exhibitions
   const [isExhModalOpen, setIsExhModalOpen] = useState(false);
   const [editingExhId, setEditingExhId] = useState<string | null>(null);
   const [isUploadingExhImage, setIsUploadingExhImage] = useState(false);
   const [newExh, setNewExh] = useState({
      title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '', isVirtual: false, status: 'UPCOMING'
   });

   // Local State for Order Tracking
   const [trackingInput, setTrackingInput] = useState<{ id: string, code: string } | null>(null);

   // Content form states
   const [heroForm, setHeroForm] = useState(siteContent);
   const [isUploading, setIsUploading] = useState(false);

   // Landing Page state
   const [landingForm, setLandingForm] = useState(landingPageContent || {
      hero: { enabled: true, title: 'Elevation of Perspective', subtitle: 'Contemporary Pakistani Art', accentWord: 'Perspective', backgroundImage: '/header_bg.jpg', backgroundImages: [] as string[] },
      featuredExhibition: { enabled: true, exhibitionId: null, manualOverride: { title: '', artistName: '', description: '', date: '', imageUrl: '' } },
      curatedCollections: { enabled: true, collections: [] },
      topPaintings: { enabled: false, artworkIds: [] },
      muraqQaJournal: { enabled: true, featuredConversationIds: [] }
   });
   const [isUploadingBgImages, setIsUploadingBgImages] = useState(false);
   const [exhibitionMode, setExhibitionMode] = useState<'auto' | 'manual'>('manual');
   const [isUploadingHero, setIsUploadingHero] = useState(false);

   useEffect(() => {
      loadStats();
   }, [activeTab]); // Reload stats when tab changes to refresh data

   const loadStats = async () => {
      try {
         const data = await adminApi.getDashboardStats();
         setStats(data.stats);
         setRecentOrders(data.recentOrders);
      } catch (err) {
         console.error('Failed to load stats', err);
      }
   };

   const loadUsers = async () => {
      try {
         const data = await adminApi.getUsers({ search: userSearch });
         setUsers(data.users);
      } catch (err) {
         console.error('Failed to load users', err);
      }
   };

   const loadArtists = async () => {
      try {
         const data = await artistApi.getAll();
         setArtists(data.artists);
      } catch (err) {
         console.error('Failed to load artists', err);
      }
   };

   const loadPendingArtists = async () => {
      setIsLoadingPending(true);
      try {
         const token = localStorage.getItem('authToken');
         const response = await fetch('http://localhost:5000/api/admin/artists/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         const data = await response.json();
         setPendingArtists(data.artists || []);
      } catch (err) {
         console.error('Failed to load pending artists', err);
      } finally {
         setIsLoadingPending(false);
      }
   };

   const handleApproveArtist = async (userId: string) => {
      setApprovingId(userId);
      try {
         const token = localStorage.getItem('authToken');
         const response = await fetch(`http://localhost:5000/api/admin/artists/${userId}/approve`, {
            method: 'PUT',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            }
         });

         if (response.ok) {
            loadPendingArtists();
            loadUsers();
            loadStats(); // Update pending count in stats
         } else {
            const data = await response.json();
            alert(data.message || 'Failed to approve artist');
         }
      } catch (err) {
         console.error('Failed to approve artist', err);
         alert('Failed to approve artist');
      } finally {
         setApprovingId(null);
      }
   };

   const handleRejectArtist = async (userId: string, deleteAccount: boolean = false) => {
      setRejectingId(userId);
      try {
         const token = localStorage.getItem('authToken');
         const response = await fetch(`http://localhost:5000/api/admin/artists/${userId}/reject`, {
            method: 'PUT',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: rejectReason, deleteAccount })
         });

         if (response.ok) {
            setShowRejectModal(null);
            setRejectReason('');
            loadPendingArtists();
            loadUsers();
            loadStats();
         } else {
            const data = await response.json();
            alert(data.message || 'Failed to reject artist');
         }
      } catch (err) {
         console.error('Failed to reject artist', err);
         alert('Failed to reject artist');
      } finally {
         setRejectingId(null);
      }
   };

   useEffect(() => {
      if (activeTab === 'USERS') {
         loadUsers();
         if (userSubTab === 'PENDING') {
            loadPendingArtists();
         }
      }
   }, [activeTab, userSearch, userSubTab]);

   useEffect(() => {
      if (activeTab === 'INVENTORY') {
         loadArtists();
      }
   }, [activeTab]);

   useEffect(() => {
      if (activeTab === 'LANDING PAGE') {
         fetchArtworks(); // Ensure artworks are loaded for the landing page selectors
      }
   }, [activeTab, fetchArtworks]);

   // Sync landingForm with landingPageContent when it loads
   useEffect(() => {
      if (landingPageContent) {
         setLandingForm(landingPageContent);
      }
   }, [landingPageContent]);


   const handleUpdateUserRole = async (userId: string, newRole: string) => {
      if (!confirm(`Are you sure you want to promote this user to ${newRole}?`)) return;
      try {
         await adminApi.updateUserRole(userId, newRole);
         loadUsers(); // Refresh list
      } catch (err) {
         alert('Failed to update user role');
      }
   };

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
      if (!newArtwork.title || !newArtwork.price) {
         alert('Please fill in Title and Price');
         return;
      }
      if (!newArtwork.artistId) {
         alert('Please select an artist');
         return;
      }
      try {
         await addArtwork({
            ...newArtwork,
            imageUrl: newArtwork.imageUrl || `https://picsum.photos/800/800?random=${Date.now()}`,
            year: newArtwork.year || new Date().getFullYear(),
            dimensions: newArtwork.dimensions || '24x24'
         } as any);
         setIsAddModalOpen(false);
         setNewArtwork({
            title: '', artistId: '', artistName: '', price: 0, category: 'Abstract', medium: '', inStock: true,
            year: new Date().getFullYear(), dimensions: '', description: '', imageUrl: ''
         });
      } catch (err) {
         alert('Failed to add artwork');
         console.error('Add artwork error:', err);
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
      if (!newExh.title || !newExh.startDate) {
         alert('Please fill in the title and start date');
         return;
      }
      if (!newExh.imageUrl) {
         alert('Please upload an exhibition image');
         return;
      }
      try {
         if (editingExhId) {
            // Update existing exhibition
            await updateExhibition(editingExhId, newExh);
         } else {
            // Add new exhibition
            await addExhibition(newExh);
         }
         setIsExhModalOpen(false);
         setEditingExhId(null);
         setNewExh({ title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '', isVirtual: false, status: 'UPCOMING' });
      } catch (err) {
         alert(`Failed to ${editingExhId ? 'update' : 'add'} exhibition`);
      }
   };

   const handleEditExhibition = (ex: any) => {
      setEditingExhId(ex.id);
      setNewExh({
         title: ex.title,
         description: ex.description,
         startDate: ex.startDate.split('T')[0],
         endDate: ex.endDate ? ex.endDate.split('T')[0] : '',
         location: ex.location,
         imageUrl: ex.imageUrl,
         isVirtual: ex.isVirtual,
         status: ex.status
      });
      setIsExhModalOpen(true);
   };

   const handleSaveContent = async () => {
      try {
         await updateSiteContent(heroForm);
         alert('Site content updated successfully!');
      } catch (err) {
         alert('Failed to update site content');
      }
   };

   const handleSaveLandingPage = async () => {
      try {
         // Clean the data: filter out empty strings from artwork IDs
         const cleanedForm = {
            ...landingForm,
            topPaintings: {
               ...landingForm.topPaintings,
               artworkIds: landingForm.topPaintings.artworkIds.filter(id => id && id.trim() !== '')
            },
            curatedCollections: {
               ...landingForm.curatedCollections,
               collections: landingForm.curatedCollections.collections.map(col => ({
                  ...col,
                  artworkIds: col.artworkIds.filter(id => id && id.trim() !== '')
               }))
            },
            muraqQaJournal: {
               ...landingForm.muraqQaJournal,
               featuredConversationIds: landingForm.muraqQaJournal.featuredConversationIds.filter(id => id && id.trim() !== '')
            }
         };

         await updateLandingPageContent(cleanedForm);
         alert('Landing page updated successfully!\n\nPlease refresh the home page to see your changes.');
      } catch (err) {
         alert('Failed to update landing page content');
         console.error('Landing page update error:', err);
      }
   };

   const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
         setIsUploadingHero(true);
         const url = await uploadApi.uploadImage(file);
         setLandingForm(prev => ({ ...prev, hero: { ...prev.hero, backgroundImage: url } }));
      } catch (error) {
         console.error('Upload failed:', error);
         alert('Failed to upload image. Please try again.');
      } finally {
         setIsUploadingHero(false);
      }
   };

   const handleBackgroundImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const currentImages = landingForm.hero.backgroundImages || [];
      if (currentImages.length >= 10) {
         alert('Maximum 10 background images allowed');
         return;
      }

      if (!file.type.startsWith('image/')) {
         alert('Please upload an image file');
         return;
      }
      if (file.size > 5 * 1024 * 1024) {
         alert('File size must be less than 5MB');
         return;
      }
      try {
         setIsUploadingBgImages(true);
         const url = await uploadApi.uploadImage(file);
         setLandingForm(prev => ({
            ...prev,
            hero: {
               ...prev.hero,
               backgroundImages: [...(prev.hero.backgroundImages || []), url]
            }
         }));
      } catch (error) {
         console.error('Upload failed:', error);
         alert('Failed to upload image. Please try again.');
      } finally {
         setIsUploadingBgImages(false);
      }
   };

   const removeBackgroundImage = (index: number) => {
      setLandingForm(prev => ({
         ...prev,
         hero: {
            ...prev.hero,
            backgroundImages: (prev.hero.backgroundImages || []).filter((_, i) => i !== index)
         }
      }));
   };

   const handleExhibitionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
         setIsUploadingExhImage(true);
         const url = await uploadApi.uploadImage(file);
         setNewExh(prev => ({ ...prev, imageUrl: url }));
      } catch (error) {
         console.error('Upload failed:', error);
         alert('Failed to upload image. Please try again.');
      } finally {
         setIsUploadingExhImage(false);
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
               {['OVERVIEW', 'INVENTORY', 'ORDERS', 'SHIPPING', 'USERS', 'FINANCE', 'CONTENT', 'EXHIBITIONS', 'LANDING PAGE'].map(tab => (
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
                  <div className="bg-stone-900 p-6 rounded-lg border border-stone-800">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-stone-400 text-sm uppercase tracking-wider">Total Revenue</span>
                        <DollarSign className="text-amber-500" size={20} />
                     </div>
                     <div className="text-2xl text-white font-serif">{convertPrice(stats?.totalRevenue || 0)}</div>
                  </div>
                  <div className="bg-stone-900 p-6 rounded-lg border border-stone-800">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-stone-400 text-sm uppercase tracking-wider">Active Users</span>
                        <Users className="text-amber-500" size={20} />
                     </div>
                     <div className="text-2xl text-white font-serif">{stats?.totalUsers || 0}</div>
                  </div>
                  <div className="bg-stone-900 p-6 rounded-lg border border-stone-800">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-stone-400 text-sm uppercase tracking-wider">Artworks</span>
                        <Package className="text-amber-500" size={20} />
                     </div>
                     <div className="text-2xl text-white font-serif">{stats?.totalArtworks || 0}</div>
                  </div>
                  <div className="bg-stone-900 p-6 rounded-lg border border-stone-800">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-stone-400 text-sm uppercase tracking-wider">Orders</span>
                        <Truck className="text-amber-500" size={20} />
                     </div>
                     <div className="text-2xl text-white font-serif">{stats?.totalOrders || 0} ({(stats?.pendingOrders || 0)} New)</div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-stone-900 p-6 border border-stone-800">
                     <h3 className="text-white font-serif text-xl mb-4">Recent Activity</h3>
                     <ul className="space-y-4 text-sm text-stone-400">
                        {recentOrders.map((o: any) => (
                           <li key={o.id} className="flex justify-between items-center border-b border-stone-800 pb-2">
                              <span>New order from <strong className="text-white">{o.user?.fullName || o.customerName}</strong></span>
                              <span className="text-xs">{new Date(o.createdAt).toLocaleDateString()}</span>
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

         {/* USERS TAB */}
         {activeTab === 'USERS' && (
            <div className="space-y-6 animate-fade-in">
               {/* Header */}
               <div className="flex justify-between items-center">
                  <div>
                     <h3 className="text-xl text-white font-serif">User Management</h3>
                     <p className="text-stone-500 text-sm mt-1">
                        {stats?.pendingArtists > 0 && (
                           <span className="text-amber-500">
                              {stats.pendingArtists} artist{stats.pendingArtists > 1 ? 's' : ''} awaiting approval
                           </span>
                        )}
                     </p>
                  </div>
                  <div className="relative">
                     <input
                        className="bg-stone-900 border border-stone-700 text-white pl-8 pr-4 py-2 text-sm rounded-full w-64"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                     />
                     <Search size={14} className="absolute left-3 top-3 text-stone-500" />
                  </div>
               </div>

               {/* Subtab Navigation */}
               <div className="flex gap-2 border-b border-stone-800 pb-4">
                  {(['ALL', 'COLLECTORS', 'ARTISTS', 'PENDING'] as const).map(tab => (
                     <button
                        key={tab}
                        onClick={() => setUserSubTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                           userSubTab === tab
                              ? 'bg-amber-600 text-white'
                              : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-white'
                        }`}
                     >
                        {tab === 'ALL' && <Users size={14} />}
                        {tab === 'COLLECTORS' && <Users size={14} />}
                        {tab === 'ARTISTS' && <Shield size={14} />}
                        {tab === 'PENDING' && (
                           <>
                              <Clock size={14} />
                              {stats?.pendingArtists > 0 && (
                                 <span className="bg-amber-500 text-stone-950 text-xs px-1.5 py-0.5 rounded-full font-bold">
                                    {stats.pendingArtists}
                                 </span>
                              )}
                           </>
                        )}
                        {tab}
                     </button>
                  ))}
               </div>

               {/* PENDING Tab Content */}
               {userSubTab === 'PENDING' && (
                  <div className="space-y-4">
                     {isLoadingPending ? (
                        <div className="flex items-center justify-center py-12">
                           <Loader2 className="animate-spin text-amber-500" size={32} />
                        </div>
                     ) : pendingArtists.length === 0 ? (
                        <div className="bg-stone-900 border border-stone-800 p-12 text-center">
                           <UserCheck size={48} className="mx-auto text-stone-600 mb-4" />
                           <p className="text-stone-400 text-lg">No pending artist approvals</p>
                           <p className="text-stone-600 text-sm mt-2">All artist applications have been reviewed</p>
                        </div>
                     ) : (
                        <div className="grid gap-4">
                           {pendingArtists.map(artist => (
                              <div key={artist.id} className="bg-stone-900 border border-stone-800 p-6 rounded-lg">
                                 <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                       <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                          {artist.fullName?.charAt(0) || 'A'}
                                       </div>
                                       <div>
                                          <h4 className="text-white font-semibold text-lg">{artist.fullName}</h4>
                                          <p className="text-stone-400 text-sm flex items-center gap-2 mt-1">
                                             <Mail size={12} /> {artist.email}
                                          </p>
                                          {artist.phoneNumber && (
                                             <p className="text-stone-500 text-sm mt-1">{artist.phoneNumber}</p>
                                          )}
                                          <div className="flex items-center gap-3 mt-3">
                                             <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                                                artist.isEmailVerified
                                                   ? 'bg-green-900/30 text-green-400'
                                                   : 'bg-yellow-900/30 text-yellow-400'
                                             }`}>
                                                {artist.isEmailVerified ? <Check size={10} /> : <Clock size={10} />}
                                                {artist.isEmailVerified ? 'Email Verified' : 'Email Pending'}
                                             </span>
                                             <span className="text-stone-600 text-xs">
                                                Applied {new Date(artist.createdAt).toLocaleDateString()}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="flex gap-2">
                                       <button
                                          onClick={() => handleApproveArtist(artist.id)}
                                          disabled={approvingId === artist.id || !artist.isEmailVerified}
                                          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
                                             !artist.isEmailVerified
                                                ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                                                : approvingId === artist.id
                                                   ? 'bg-green-800 text-green-200'
                                                   : 'bg-green-600 hover:bg-green-500 text-white'
                                          }`}
                                          title={!artist.isEmailVerified ? 'Artist must verify email first' : 'Approve artist'}
                                       >
                                          {approvingId === artist.id ? (
                                             <Loader2 size={14} className="animate-spin" />
                                          ) : (
                                             <UserCheck size={14} />
                                          )}
                                          Approve
                                       </button>
                                       <button
                                          onClick={() => setShowRejectModal(artist.id)}
                                          disabled={rejectingId === artist.id}
                                          className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white transition-all"
                                       >
                                          <UserX size={14} />
                                          Reject
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}

               {/* ALL / COLLECTORS / ARTISTS Tab Content */}
               {userSubTab !== 'PENDING' && (
                  <div className="bg-stone-900 border border-stone-800 overflow-x-auto rounded-lg">
                     <table className="w-full text-left text-sm text-stone-400">
                        <thead className="bg-stone-950 text-stone-500 uppercase text-xs border-b border-stone-800">
                           <tr>
                              <th className="p-4">Name</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Role</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Joined</th>
                              <th className="p-4">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800">
                           {users
                              .filter(u => {
                                 if (userSubTab === 'COLLECTORS') return u.role === 'USER';
                                 if (userSubTab === 'ARTISTS') return u.role === 'ARTIST';
                                 return true;
                              })
                              .map(u => (
                                 <tr key={u.id} className="hover:bg-stone-800/30">
                                    <td className="p-4 text-white font-medium">{u.fullName}</td>
                                    <td className="p-4">{u.email}</td>
                                    <td className="p-4">
                                       <span className={`px-2 py-1 text-xs rounded ${
                                          u.role === 'ADMIN' ? 'bg-amber-900/30 text-amber-500' :
                                          u.role === 'ARTIST' ? 'bg-purple-900/30 text-purple-400' :
                                          'bg-stone-800 text-stone-500'
                                       }`}>
                                          {u.role}
                                       </span>
                                    </td>
                                    <td className="p-4">
                                       <div className="flex flex-col gap-1">
                                          <span className={`px-2 py-0.5 text-xs rounded inline-flex items-center gap-1 w-fit ${
                                             u.isEmailVerified
                                                ? 'bg-green-900/30 text-green-400'
                                                : 'bg-yellow-900/30 text-yellow-400'
                                          }`}>
                                             {u.isEmailVerified ? <Check size={10} /> : <Clock size={10} />}
                                             {u.isEmailVerified ? 'Verified' : 'Unverified'}
                                          </span>
                                          {u.role === 'ARTIST' && (
                                             <span className={`px-2 py-0.5 text-xs rounded inline-flex items-center gap-1 w-fit ${
                                                u.isApproved
                                                   ? 'bg-green-900/30 text-green-400'
                                                   : 'bg-orange-900/30 text-orange-400'
                                             }`}>
                                                {u.isApproved ? <UserCheck size={10} /> : <Clock size={10} />}
                                                {u.isApproved ? 'Approved' : 'Pending'}
                                             </span>
                                          )}
                                       </div>
                                    </td>
                                    <td className="p-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                       <div className="flex gap-2">
                                          {u.role === 'USER' && (
                                             <button
                                                onClick={() => handleUpdateUserRole(u.id, 'ARTIST')}
                                                className="text-xs text-purple-400 hover:underline"
                                             >
                                                Promote to Artist
                                             </button>
                                          )}
                                          {u.role !== 'ADMIN' && (
                                             <button
                                                onClick={() => handleUpdateUserRole(u.id, 'ADMIN')}
                                                className="text-xs text-amber-500 hover:underline"
                                             >
                                                Make Admin
                                             </button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                        </tbody>
                     </table>
                     {users.filter(u => {
                        if (userSubTab === 'COLLECTORS') return u.role === 'USER';
                        if (userSubTab === 'ARTISTS') return u.role === 'ARTIST';
                        return true;
                     }).length === 0 && (
                        <div className="p-12 text-center">
                           <Users size={48} className="mx-auto text-stone-600 mb-4" />
                           <p className="text-stone-400">No users found</p>
                        </div>
                     )}
                  </div>
               )}

               {/* Reject Modal */}
               {showRejectModal && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                     <div className="bg-stone-900 border border-stone-700 p-6 w-full max-w-md rounded-lg space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center">
                              <AlertCircle className="text-red-400" size={20} />
                           </div>
                           <h3 className="text-white text-xl font-serif">Reject Artist Application</h3>
                        </div>
                        <p className="text-stone-400 text-sm">
                           Provide a reason for rejection. The applicant will be notified via email.
                        </p>
                        <textarea
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white rounded-lg"
                           placeholder="Reason for rejection (optional)..."
                           rows={3}
                           value={rejectReason}
                           onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-2 pt-2">
                           <button
                              onClick={() => handleRejectArtist(showRejectModal, false)}
                              disabled={rejectingId === showRejectModal}
                              className="flex-1 bg-orange-600 hover:bg-orange-500 py-2 text-white rounded-lg flex items-center justify-center gap-2"
                           >
                              {rejectingId === showRejectModal ? (
                                 <Loader2 size={14} className="animate-spin" />
                              ) : (
                                 <UserX size={14} />
                              )}
                              Convert to Collector
                           </button>
                           <button
                              onClick={() => handleRejectArtist(showRejectModal, true)}
                              disabled={rejectingId === showRejectModal}
                              className="flex-1 bg-red-600 hover:bg-red-500 py-2 text-white rounded-lg flex items-center justify-center gap-2"
                           >
                              {rejectingId === showRejectModal ? (
                                 <Loader2 size={14} className="animate-spin" />
                              ) : (
                                 <Trash2 size={14} />
                              )}
                              Delete Account
                           </button>
                        </div>
                        <button
                           onClick={() => {
                              setShowRejectModal(null);
                              setRejectReason('');
                           }}
                           className="w-full bg-stone-800 hover:bg-stone-700 py-2 text-stone-300 rounded-lg"
                        >
                           Cancel
                        </button>
                     </div>
                  </div>
               )}
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

                              {/* Artist Dropdown */}
                              <select
                                 className="w-full bg-stone-950 border border-stone-700 p-2 text-white text-sm"
                                 value={newArtwork.artistId || ''}
                                 onChange={e => {
                                    const selectedArtist = artists.find(a => a.id === e.target.value);
                                    setNewArtwork({
                                       ...newArtwork,
                                       artistId: e.target.value,
                                       artistName: selectedArtist?.user?.fullName || ''
                                    });
                                 }}
                              >
                                 <option value="">Select Artist</option>
                                 {artists.map(artist => (
                                    <option key={artist.id} value={artist.id}>
                                       {artist.user?.fullName || 'Unknown Artist'} {artist.originCity ? `(${artist.originCity})` : ''}
                                    </option>
                                 ))}
                              </select>

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
                           <h3 className="text-xl text-white font-serif">{editingExhId ? 'Edit Exhibition' : 'Add New Exhibition'}</h3>
                           <button onClick={() => { setIsExhModalOpen(false); setEditingExhId(null); setNewExh({ title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '', isVirtual: false, status: 'UPCOMING' }); }}><X className="text-stone-500 hover:text-white" /></button>
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

                           {/* Image Upload */}
                           <div className="space-y-2">
                              <label className="text-xs text-stone-500 block">Exhibition Image</label>
                              <div className="bg-stone-950 border border-stone-700 p-4 min-h-[200px] flex items-center justify-center">
                                 {newExh.imageUrl ? (
                                    <div className="relative w-full">
                                       <img src={newExh.imageUrl} alt="Preview" className="w-full h-48 object-cover rounded" />
                                       <div className="mt-3 flex gap-2">
                                          <label className="flex-1 cursor-pointer bg-stone-800 hover:bg-stone-700 text-white text-center py-2 text-sm transition-colors">
                                             {isUploadingExhImage ? 'Uploading...' : 'Change Image'}
                                             <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleExhibitionImageUpload}
                                                disabled={isUploadingExhImage}
                                             />
                                          </label>
                                          <button
                                             type="button"
                                             onClick={() => setNewExh({ ...newExh, imageUrl: '' })}
                                             className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 text-sm transition-colors"
                                          >
                                             Remove
                                          </button>
                                       </div>
                                    </div>
                                 ) : (
                                    <label className="cursor-pointer text-stone-500 flex flex-col items-center gap-3 w-full h-full min-h-[180px] justify-center hover:text-stone-400 transition-colors">
                                       {isUploadingExhImage ? (
                                          <div className="flex flex-col items-center gap-2">
                                             <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                             <span className="text-sm">Uploading...</span>
                                          </div>
                                       ) : (
                                          <>
                                             <ImageIcon size={48} />
                                             <div className="text-center">
                                                <span className="block text-sm">Click to upload exhibition image</span>
                                                <span className="text-xs text-stone-600">Max 5MB • JPG, PNG, GIF</span>
                                             </div>
                                          </>
                                       )}
                                       <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={handleExhibitionImageUpload}
                                          disabled={isUploadingExhImage}
                                       />
                                    </label>
                                 )}
                              </div>
                           </div>
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
                              {editingExhId ? 'Update Exhibition' : 'Publish Exhibition'}
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
                           <button onClick={() => handleEditExhibition(ex)} className="p-2 text-stone-500 hover:text-amber-500 hover:bg-amber-900/10 rounded"><Edit size={18} /></button>
                           <button onClick={() => deleteExhibition(ex.id)} className="p-2 text-stone-500 hover:text-red-500 hover:bg-red-900/10 rounded"><Trash2 size={18} /></button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* LANDING PAGE TAB */}
         {activeTab === 'LANDING PAGE' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-serif text-white">Landing Page Management</h2>
                  <button onClick={handleSaveLandingPage} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 font-bold flex items-center gap-2 transition-colors">
                     <Save size={18} /> Save All Changes
                  </button>
               </div>

               {/* Section Toggles */}
               <div className="bg-stone-900 p-6 border border-stone-800">
                  <h3 className="text-white font-serif text-xl mb-4">Section Visibility</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {Object.keys(landingForm).map(sectionKey => (
                        <label key={sectionKey} className="flex items-center gap-3 p-3 bg-stone-950 border border-stone-700 cursor-pointer hover:border-amber-600 transition-colors">
                           <input
                              type="checkbox"
                              checked={landingForm[sectionKey].enabled}
                              onChange={(e) => setLandingForm(prev => ({
                                 ...prev,
                                 [sectionKey]: { ...prev[sectionKey], enabled: e.target.checked }
                              }))}
                              className="accent-amber-600 w-5 h-5"
                           />
                           <span className="text-white uppercase tracking-wide text-sm">{sectionKey.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                     ))}
                  </div>
               </div>

               {/* Hero Section Editor */}
               <div className="bg-stone-900 p-6 border border-stone-800">
                  <h3 className="text-white font-serif text-xl mb-4 flex items-center gap-2">
                     <ImageIcon size={20} className="text-amber-600" /> Hero Section
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <div>
                           <label className="text-stone-400 text-sm uppercase tracking-wide block mb-2">Title</label>
                           <input
                              type="text"
                              value={landingForm.hero.title}
                              onChange={(e) => setLandingForm(prev => ({ ...prev, hero: { ...prev.hero, title: e.target.value } }))}
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                              maxLength={100}
                           />
                        </div>
                        <div>
                           <label className="text-stone-400 text-sm uppercase tracking-wide block mb-2">Subtitle</label>
                           <input
                              type="text"
                              value={landingForm.hero.subtitle}
                              onChange={(e) => setLandingForm(prev => ({ ...prev, hero: { ...prev.hero, subtitle: e.target.value } }))}
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                              maxLength={100}
                           />
                        </div>
                        <div>
                           <label className="text-stone-400 text-sm uppercase tracking-wide block mb-2">Accent Word (for italic styling)</label>
                           <input
                              type="text"
                              value={landingForm.hero.accentWord}
                              onChange={(e) => setLandingForm(prev => ({ ...prev, hero: { ...prev.hero, accentWord: e.target.value } }))}
                              className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                              maxLength={30}
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-stone-400 text-sm uppercase tracking-wide block mb-2">Background Image</label>
                        <div className="relative h-64 bg-stone-950 border border-stone-700 flex items-center justify-center group">
                           {landingForm.hero.backgroundImage ? (
                              <>
                                 <img src={landingForm.hero.backgroundImage} alt="Hero" className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer text-white flex flex-col items-center gap-2">
                                       {isUploadingHero ? <span>Uploading...</span> : <><ImageIcon size={32} /><span>Change Image</span></>}
                                       <input type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} disabled={isUploadingHero} />
                                    </label>
                                 </div>
                              </>
                           ) : (
                              <label className="cursor-pointer text-stone-500 flex flex-col items-center gap-2">
                                 {isUploadingHero ? <span>Uploading...</span> : <><ImageIcon size={48} /><span>Upload Image</span></>}
                                 <input type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} disabled={isUploadingHero} />
                              </label>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Background Slideshow Images */}
               <div className="bg-stone-900 p-6 border border-stone-800">
                  <h3 className="text-white font-serif text-xl mb-4 flex items-center gap-2">
                     <ImageIcon size={20} className="text-amber-600" /> Background Slideshow Images
                  </h3>
                  <p className="text-stone-500 text-sm mb-4">
                     Upload multiple background images for an animated slideshow effect on the landing page hero section.
                     Images will zoom in and fade to the next one continuously. Maximum 10 images.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                     {(landingForm.hero.backgroundImages || []).map((imgUrl: string, index: number) => (
                        <div key={index} className="relative group aspect-video bg-stone-950 border border-stone-700 overflow-hidden">
                           <img src={imgUrl} alt={`Background ${index + 1}`} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                 onClick={() => removeBackgroundImage(index)}
                                 className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                           <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                              {index + 1}
                           </span>
                        </div>
                     ))}

                     {/* Upload button */}
                     {(landingForm.hero.backgroundImages || []).length < 10 && (
                        <label className="aspect-video bg-stone-950 border-2 border-dashed border-stone-700 hover:border-amber-600 flex flex-col items-center justify-center cursor-pointer transition-colors">
                           {isUploadingBgImages ? (
                              <div className="flex flex-col items-center gap-2">
                                 <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                 <span className="text-xs text-stone-500">Uploading...</span>
                              </div>
                           ) : (
                              <>
                                 <Plus size={24} className="text-stone-500 mb-1" />
                                 <span className="text-xs text-stone-500">Add Image</span>
                              </>
                           )}
                           <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleBackgroundImagesUpload}
                              disabled={isUploadingBgImages}
                           />
                        </label>
                     )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                     <span className="text-stone-500">
                        {(landingForm.hero.backgroundImages || []).length} / 10 images uploaded
                     </span>
                     {(landingForm.hero.backgroundImages || []).length > 0 && (
                        <button
                           onClick={() => setLandingForm(prev => ({ ...prev, hero: { ...prev.hero, backgroundImages: [] } }))}
                           className="text-red-500 hover:text-red-400 text-xs uppercase tracking-wide"
                        >
                           Clear All
                        </button>
                     )}
                  </div>
                  <p className="text-amber-500/70 text-xs mt-3">
                     Note: If slideshow images are uploaded, they will be used instead of the single background image above.
                  </p>
               </div>

               {/* Featured Exhibition Selector */}
               <div className="bg-stone-900 p-6 border border-stone-800">
                  <h3 className="text-white font-serif text-xl mb-4">Featured Exhibition</h3>
                  <div className="flex gap-4 mb-4">
                     <button
                        onClick={() => setExhibitionMode('auto')}
                        className={`px-4 py-2 border ${exhibitionMode === 'auto' ? 'border-amber-600 bg-amber-600/10 text-amber-600' : 'border-stone-700 text-stone-400'}`}
                     >
                        Auto (Select from Exhibitions)
                     </button>
                     <button
                        onClick={() => setExhibitionMode('manual')}
                        className={`px-4 py-2 border ${exhibitionMode === 'manual' ? 'border-amber-600 bg-amber-600/10 text-amber-600' : 'border-stone-700 text-stone-400'}`}
                     >
                        Manual Override
                     </button>
                  </div>
                  {exhibitionMode === 'auto' ? (
                     <div>
                        <label className="text-stone-400 text-sm uppercase tracking-wide block mb-2">Select Exhibition</label>
                        <select
                           value={landingForm.featuredExhibition.exhibitionId || ''}
                           onChange={(e) => setLandingForm(prev => ({ ...prev, featuredExhibition: { ...prev.featuredExhibition, exhibitionId: e.target.value || null } }))}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                        >
                           <option value="">-- Select Exhibition --</option>
                           {exhibitions.filter(ex => ex.status === 'CURRENT').map(ex => (
                              <option key={ex.id} value={ex.id}>{ex.title} ({new Date(ex.startDate).toLocaleDateString()})</option>
                           ))}
                        </select>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                           type="text"
                           placeholder="Title"
                           value={landingForm.featuredExhibition.manualOverride?.title || ''}
                           onChange={(e) => setLandingForm(prev => ({ ...prev, featuredExhibition: { ...prev.featuredExhibition, manualOverride: { ...prev.featuredExhibition.manualOverride, title: e.target.value } as any } }))}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                        />
                        <input
                           type="text"
                           placeholder="Artist Name"
                           value={landingForm.featuredExhibition.manualOverride?.artistName || ''}
                           onChange={(e) => setLandingForm(prev => ({ ...prev, featuredExhibition: { ...prev.featuredExhibition, manualOverride: { ...prev.featuredExhibition.manualOverride, artistName: e.target.value } as any } }))}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                        />
                        <input
                           type="text"
                           placeholder="Date (e.g., OCT 12 — DEC 24)"
                           value={landingForm.featuredExhibition.manualOverride?.date || ''}
                           onChange={(e) => setLandingForm(prev => ({ ...prev, featuredExhibition: { ...prev.featuredExhibition, manualOverride: { ...prev.featuredExhibition.manualOverride, date: e.target.value } as any } }))}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                        />
                        <input
                           type="text"
                           placeholder="Image URL"
                           value={landingForm.featuredExhibition.manualOverride?.imageUrl || ''}
                           onChange={(e) => setLandingForm(prev => ({ ...prev, featuredExhibition: { ...prev.featuredExhibition, manualOverride: { ...prev.featuredExhibition.manualOverride, imageUrl: e.target.value } as any } }))}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                        />
                        <textarea
                           placeholder="Description"
                           value={landingForm.featuredExhibition.manualOverride?.description || ''}
                           onChange={(e) => setLandingForm(prev => ({ ...prev, featuredExhibition: { ...prev.featuredExhibition, manualOverride: { ...prev.featuredExhibition.manualOverride, description: e.target.value } as any } }))}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none md:col-span-2"
                           rows={3}
                        />
                     </div>
                  )}
               </div>

               {/* Top Paintings Selector */}
               <div className="bg-stone-900 p-6 border border-stone-800">
                  <h3 className="text-white font-serif text-xl mb-4">Top 5 Paintings</h3>
                  <div className="space-y-3">
                     <div className="text-stone-400 text-sm mb-2">
                        Selected: {landingForm.topPaintings.artworkIds.filter(id => id && id.trim()).length} / 5
                        {artworks.length === 0 && <span className="text-amber-500 ml-2">(Loading artworks...)</span>}
                     </div>
                     {landingForm.topPaintings.artworkIds.filter(id => id && id.trim()).map((artworkId, idx) => {
                        const artwork = artworks.find(a => a.id === artworkId);
                        return (
                           <div key={idx} className="flex items-center gap-3 bg-stone-950 p-3 border border-stone-700">
                              {artwork && <img src={artwork.imageUrl} alt={artwork.title} className="w-16 h-16 object-cover" />}
                              <div className="flex-1">
                                 <span className="text-white block">{artwork?.title || 'Loading...'}</span>
                                 {artwork && <span className="text-stone-500 text-xs">by {artwork.artistName || 'Unknown Artist'}</span>}
                              </div>
                              <button
                                 onClick={() => setLandingForm(prev => ({ ...prev, topPaintings: { ...prev.topPaintings, artworkIds: prev.topPaintings.artworkIds.filter((_, i) => i !== idx) } }))}
                                 className="text-red-500 hover:text-red-400"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        );
                     })}
                     {landingForm.topPaintings.artworkIds.filter(id => id && id.trim()).length < 5 && (
                        <select
                           value=""
                           onChange={(e) => {
                              const selectedId = e.target.value;
                              if (selectedId && !landingForm.topPaintings.artworkIds.includes(selectedId)) {
                                 setLandingForm(prev => ({
                                    ...prev,
                                    topPaintings: {
                                       ...prev.topPaintings,
                                       artworkIds: [...prev.topPaintings.artworkIds.filter(id => id && id.trim()), selectedId]
                                    }
                                 }));
                              }
                           }}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                        >
                           <option value="">+ Add Artwork</option>
                           {artworks.filter(a => !landingForm.topPaintings.artworkIds.includes(a.id)).map(art => (
                              <option key={art.id} value={art.id}>{art.title} - {art.artistName || 'Unknown'}</option>
                           ))}
                        </select>
                     )}
                  </div>
               </div>

               {/* Curated Collections Builder */}
               <div className="bg-stone-900 p-6 border border-stone-800">
                  <h3 className="text-white font-serif text-xl mb-4">Curated Collections</h3>
                  <div className="space-y-4">
                     {landingForm.curatedCollections.collections.map((collection, idx) => (
                        <div key={collection.id} className="bg-stone-950 p-4 border border-stone-700">
                           <div className="flex justify-between items-center mb-3">
                              <input
                                 type="text"
                                 placeholder="Collection Title"
                                 value={collection.title}
                                 onChange={(e) => {
                                    const updated = [...landingForm.curatedCollections.collections];
                                    updated[idx] = { ...updated[idx], title: e.target.value };
                                    setLandingForm(prev => ({ ...prev, curatedCollections: { ...prev.curatedCollections, collections: updated } }));
                                 }}
                                 className="flex-1 bg-stone-900 border border-stone-700 p-2 text-white mr-2"
                              />
                              <select
                                 value={collection.layout}
                                 onChange={(e) => {
                                    const updated = [...landingForm.curatedCollections.collections];
                                    updated[idx] = { ...updated[idx], layout: e.target.value as any };
                                    setLandingForm(prev => ({ ...prev, curatedCollections: { ...prev.curatedCollections, collections: updated } }));
                                 }}
                                 className="bg-stone-900 border border-stone-700 p-2 text-white mr-2"
                              >
                                 <option value="normal">Normal</option>
                                 <option value="large">Large (2 cols)</option>
                                 <option value="tall">Tall</option>
                              </select>
                              <button
                                 onClick={() => setLandingForm(prev => ({ ...prev, curatedCollections: { ...prev.curatedCollections, collections: prev.curatedCollections.collections.filter((_, i) => i !== idx) } }))}
                                 className="text-red-500 hover:text-red-400"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </div>
                           <div className="text-stone-400 text-sm mb-2">
                              Artworks in collection: {collection.artworkIds.filter(id => id && id.trim()).length}
                              {artworks.length === 0 && <span className="text-amber-500 ml-2">(Loading artworks...)</span>}
                           </div>
                           <select
                              value=""
                              onChange={(e) => {
                                 const selectedId = e.target.value;
                                 if (selectedId && !collection.artworkIds.includes(selectedId)) {
                                    const updated = [...landingForm.curatedCollections.collections];
                                    updated[idx] = {
                                       ...updated[idx],
                                       artworkIds: [...updated[idx].artworkIds.filter(id => id && id.trim()), selectedId]
                                    };
                                    setLandingForm(prev => ({ ...prev, curatedCollections: { ...prev.curatedCollections, collections: updated } }));
                                 }
                              }}
                              className="w-full bg-stone-900 border border-stone-700 p-2 text-white"
                           >
                              <option value="">+ Add Artwork to Collection</option>
                              {artworks.filter(a => !collection.artworkIds.includes(a.id)).map(art => (
                                 <option key={art.id} value={art.id}>{art.title} - {art.artistName || 'Unknown'}</option>
                              ))}
                           </select>
                           <div className="flex flex-wrap gap-2 mt-2">
                              {collection.artworkIds.filter(id => id && id.trim()).map(artId => {
                                 const artwork = artworks.find(a => a.id === artId);
                                 return (
                                    <div key={artId} className="bg-stone-900 px-2 py-1 text-xs text-white flex items-center gap-2">
                                       {artwork?.title || 'Loading...'}
                                       <button
                                          onClick={() => {
                                             const updated = [...landingForm.curatedCollections.collections];
                                             updated[idx] = { ...updated[idx], artworkIds: updated[idx].artworkIds.filter(id => id !== artId) };
                                             setLandingForm(prev => ({ ...prev, curatedCollections: { ...prev.curatedCollections, collections: updated } }));
                                          }}
                                          className="text-red-500"
                                       >
                                          <X size={14} />
                                       </button>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     ))}
                     {landingForm.curatedCollections.collections.length < 3 && (
                        <button
                           onClick={() => setLandingForm(prev => ({ ...prev, curatedCollections: { ...prev.curatedCollections, collections: [...prev.curatedCollections.collections, { id: Date.now().toString(), title: '', artworkIds: [], layout: 'normal' }] } }))}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-stone-400 hover:text-white hover:border-amber-600 transition-colors flex items-center justify-center gap-2"
                        >
                           <Plus size={18} /> Add Collection (Max 3)
                        </button>
                     )}
                  </div>
               </div>

               {/* Muraqqa Journal Selector */}
               <div className="bg-stone-900 p-6 border border-stone-800">
                  <h3 className="text-white font-serif text-xl mb-4">Muraqqa Journal (Featured Conversations)</h3>
                  <div className="space-y-3">
                     <div className="text-stone-400 text-sm mb-2">Selected: {landingForm.muraqQaJournal.featuredConversationIds.length} / 3</div>
                     {landingForm.muraqQaJournal.featuredConversationIds.map((convId, idx) => {
                        const conversation = conversations.find(c => c.id === convId);
                        return (
                           <div key={idx} className="flex items-center gap-3 bg-stone-950 p-3 border border-stone-700">
                              <span className={`px-2 py-1 text-xs ${conversation?.category === 'WATCH' ? 'bg-blue-900/30 text-blue-400' : conversation?.category === 'LISTEN' ? 'bg-purple-900/30 text-purple-400' : 'bg-green-900/30 text-green-400'}`}>
                                 {conversation?.category}
                              </span>
                              <span className="text-white flex-1">{conversation?.title || 'Unknown'}</span>
                              <button
                                 onClick={() => setLandingForm(prev => ({ ...prev, muraqQaJournal: { ...prev.muraqQaJournal, featuredConversationIds: prev.muraqQaJournal.featuredConversationIds.filter((_, i) => i !== idx) } }))}
                                 className="text-red-500 hover:text-red-400"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        );
                     })}
                     {landingForm.muraqQaJournal.featuredConversationIds.length < 3 && (
                        <select
                           onChange={(e) => {
                              if (e.target.value && !landingForm.muraqQaJournal.featuredConversationIds.includes(e.target.value)) {
                                 setLandingForm(prev => ({ ...prev, muraqQaJournal: { ...prev.muraqQaJournal, featuredConversationIds: [...prev.muraqQaJournal.featuredConversationIds, e.target.value] } }));
                              }
                              e.target.value = '';
                           }}
                           className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-600 outline-none"
                        >
                           <option value="">+ Add Conversation</option>
                           {conversations.filter(c => !landingForm.muraqQaJournal.featuredConversationIds.includes(c.id)).map(conv => (
                              <option key={conv.id} value={conv.id}>[{conv.category}] {conv.title}</option>
                           ))}
                        </select>
                     )}
                  </div>
               </div>

               {/* Save Button at Bottom */}
               <div className="flex justify-end">
                  <button onClick={handleSaveLandingPage} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 font-bold flex items-center gap-2 transition-colors">
                     <Save size={18} /> Save Landing Page
                  </button>
               </div>
            </div>
         )}
      </div>

   );
};
