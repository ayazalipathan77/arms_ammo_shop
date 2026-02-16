import React, { useState, useEffect } from 'react';
import {
   LayoutDashboard, Package, Users, DollarSign, Settings,
   Plus, Edit, Trash2, Truck, CreditCard, Check, X, Search,
   Video, Globe, MessageSquare, Save, Facebook, Instagram, Image as ImageIcon, Calendar,
   UserCheck, UserX, Clock, Mail, Shield, AlertCircle, Loader2, Palette, Type, Upload
} from 'lucide-react';
import { useGallery } from '../context/GalleryContext';
import { useTheme, PRESET_THEMES, ThemeConfig } from '../context/ThemeContext';
import { OrderStatus, Artwork, Conversation, PrintSizeOption } from '../types';
import { uploadApi, adminApi, artistApi, reviewApi, settingsApi, artworkApi, transformArtwork } from '../services/api';
import Button from '../components/ui/Button';
import StarRating from '../components/ui/StarRating';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

// Helper to get CSRF token from cookies
const getCsrfToken = (): string | null => {
    const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
    return match ? match[2] : null;
};

const ORDER_STATUSES = ['PENDING', 'PAID', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const AdminDashboard: React.FC = () => {
   const {
      artworks, orders, shippingConfig, stripeConnected, conversations, siteContent, exhibitions,
      addArtwork, updateArtwork, deleteArtwork, updateOrderStatus, updateShippingConfig, connectStripe,
      addConversation, deleteConversation, updateSiteContent, addExhibition, updateExhibition, deleteExhibition,
      landingPageContent, updateLandingPageContent, fetchArtworks, availableCategories
   } = useGallery();

   const convertPrice = (price: number) => `PKR ${price.toLocaleString()}`;

   // Dynamic API URL detection
   const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
   const API_URL = isLocalhost ? 'http://localhost:5000/api' : '/api';

   const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVENTORY' | 'ORDERS' | 'SHIPPING' | 'FINANCE' | 'EXHIBITIONS' | 'USERS' | 'REVIEWS' | 'REFERRALS' | 'LANDING PAGE' | 'THEME'>('OVERVIEW');

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
   const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
   const [userCounts, setUserCounts] = useState({ all: 0, collectors: 0, artists: 0, pending: 0 });
   const [isLoadingUsers, setIsLoadingUsers] = useState(false);
   const [userSortField, setUserSortField] = useState<'role' | 'createdAt'>('createdAt');
   const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('desc');
   const [debouncedSearch, setDebouncedSearch] = useState('');

   // Referral Admin State
   const [referralConfig, setReferralConfig] = useState({ isEnabled: false, rewardPercentage: 0, rewardAmount: 0, maxRewardsPerUser: 10 });
   const [referralStats, setReferralStats] = useState<{ totalReferredUsers: number; totalReferrers: number; topReferrers: any[] } | null>(null);
   const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
   const [isSavingReferralConfig, setIsSavingReferralConfig] = useState(false);

   // Artists State
   const [artists, setArtists] = useState<any[]>([]);

   // Reviews State
   const [reviews, setReviews] = useState<any[]>([]);
   const [reviewFilter, setReviewFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
   const [isLoadingReviews, setIsLoadingReviews] = useState(false);
   const [reviewActionLoading, setReviewActionLoading] = useState<string | null>(null);

   // Inventory State
   const [inventorySearch, setInventorySearch] = useState('');
   const [inventoryCategory, setInventoryCategory] = useState('ALL');
   const [inventoryStock, setInventoryStock] = useState<'ALL' | 'IN_STOCK' | 'SOLD_OUT'>('ALL');
   const [inventoryArtworks, setInventoryArtworks] = useState<any[]>([]);
   const [inventoryPagination, setInventoryPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
   const [inventorySortField, setInventorySortField] = useState<'title' | 'price' | 'createdAt'>('createdAt');
   const [inventorySortDir, setInventorySortDir] = useState<'asc' | 'desc'>('desc');
   const [isLoadingInventory, setIsLoadingInventory] = useState(false);
   const [debouncedInventorySearch, setDebouncedInventorySearch] = useState('');

   // Order Sorting
   const [orderSortField, setOrderSortField] = useState<'createdAt' | 'totalAmount' | 'status'>('createdAt');
   const [orderSortDir, setOrderSortDir] = useState<'asc' | 'desc'>('desc');

   // Local State for Artworks
   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
   const [newArtwork, setNewArtwork] = useState<any>({
      title: '', artistId: '', artistName: '', price: 0, category: 'Abstract', medium: '', inStock: true,
      year: new Date().getFullYear(), dimensions: '', description: '', imageUrl: '',
      printOptions: { enabled: false, sizes: [] }
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
   const [isUploadingExhGallery, setIsUploadingExhGallery] = useState(false);
   const [newExh, setNewExh] = useState({
      title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '', isVirtual: false, status: 'UPCOMING',
      galleryImages: [] as string[], videoUrl: '', virtualUrl: '', venueName: ''
   });

   // Order Management State
   const [trackingInput, setTrackingInput] = useState<{ id: string, code: string } | null>(null);
   const [adminOrders, setAdminOrders] = useState<any[]>([]);
   const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
   const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
   const [orderSearch, setOrderSearch] = useState('');
   const [selectedOrder, setSelectedOrder] = useState<any>(null);
   const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
   const [shipModal, setShipModal] = useState<{ orderId: string; trackingNumber: string; carrier: string; notes: string } | null>(null);
   const [cancelModal, setCancelModal] = useState<{ orderId: string; reason: string } | null>(null);
   const [orderNotesInput, setOrderNotesInput] = useState<{ orderId: string; notes: string } | null>(null);

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

   // Theme State
   const { currentTheme, applyTheme, resetTheme } = useTheme();
   const [themeBuilder, setThemeBuilder] = useState<ThemeConfig>(currentTheme);

   // Sync builder state when currentTheme changes (e.g. on reset)
   useEffect(() => {
      setThemeBuilder(currentTheme);
   }, [currentTheme]);

   useEffect(() => {
      loadStats();
      if (activeTab === 'ORDERS') loadAdminOrders();
   }, [activeTab, orderStatusFilter, orderSortField, orderSortDir]);

   // Inventory debounced search
   useEffect(() => {
      const timer = setTimeout(() => setDebouncedInventorySearch(inventorySearch), 300);
      return () => clearTimeout(timer);
   }, [inventorySearch]);

   // Load inventory when tab is active or filters change
   useEffect(() => {
      if (activeTab === 'INVENTORY') loadInventory();
   }, [activeTab, debouncedInventorySearch, inventoryCategory, inventoryStock, inventorySortField, inventorySortDir]);

   const loadStats = async () => {
      try {
         const data = await adminApi.getDashboardStats();
         setStats(data.stats);
         setRecentOrders(data.recentOrders);
      } catch (err) {
         console.error('Failed to load stats', err);
      }
   };

   // Order Management Functions
   const loadAdminOrders = async (page = 1) => {
      try {
         const filters: any = { page, limit: 20, sortBy: orderSortField, sortOrder: orderSortDir };
         if (orderStatusFilter !== 'ALL') filters.status = orderStatusFilter;
         if (orderSearch) filters.search = orderSearch;
         const data = await adminApi.getAllOrders(filters);
         setAdminOrders(data.orders || []);
         setOrdersPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } catch (err) {
         console.error('Failed to load orders', err);
      }
   };

   // Inventory Functions
   const loadInventory = async (page = 1) => {
      setIsLoadingInventory(true);
      try {
         const filters: any = { page, limit: 20, sortBy: inventorySortField, sortOrder: inventorySortDir };
         if (debouncedInventorySearch) filters.search = debouncedInventorySearch;
         if (inventoryCategory !== 'ALL') filters.category = inventoryCategory;
         if (inventoryStock === 'IN_STOCK') filters.inStock = true;
         if (inventoryStock === 'SOLD_OUT') filters.inStock = false;
         const data = await artworkApi.getAll(filters);
         setInventoryArtworks(data.artworks.map(transformArtwork));
         setInventoryPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } catch (err) {
         console.error('Failed to load inventory', err);
      } finally {
         setIsLoadingInventory(false);
      }
   };

   // Refresh order list and update selectedOrder if open
   const refreshOrders = async (orderId?: string) => {
      await loadAdminOrders(ordersPagination.page);
      if (orderId && selectedOrder?.id === orderId) {
         try {
            const res = await adminApi.getOrderById(orderId);
            setSelectedOrder(res.order || res);
         } catch { /* order detail refresh is best-effort */ }
      }
   };

   const handleMarkAsPaid = async (orderId: string) => {
      setOrderActionLoading(orderId);
      try {
         await adminApi.markOrderPaid(orderId);
         await refreshOrders(orderId);
      } catch (err: any) {
         alert(err.message || 'Failed to mark as paid');
      }
      setOrderActionLoading(null);
   };

   const handleRequestArtistConfirmation = async (orderId: string) => {
      setOrderActionLoading(orderId);
      try {
         await adminApi.requestArtistConfirmation(orderId);
         await refreshOrders(orderId);
      } catch (err: any) {
         alert(err.message || 'Failed to send artist confirmation');
      }
      setOrderActionLoading(null);
   };

   const handleAdminConfirm = async (orderId: string) => {
      setOrderActionLoading(orderId);
      try {
         await adminApi.adminConfirmOrder(orderId);
         await refreshOrders(orderId);
      } catch (err: any) {
         alert(err.message || 'Failed to confirm order');
      }
      setOrderActionLoading(null);
   };

   const handleShipOrder = async () => {
      if (!shipModal) return;
      setOrderActionLoading(shipModal.orderId);
      try {
         await adminApi.markOrderShipped(shipModal.orderId, shipModal.trackingNumber, shipModal.carrier || undefined, shipModal.notes || undefined);
         const oid = shipModal.orderId;
         setShipModal(null);
         await refreshOrders(oid);
      } catch (err: any) {
         alert(err.message || 'Failed to mark as shipped');
      }
      setOrderActionLoading(null);
   };

   const handleDeliverOrder = async (orderId: string) => {
      setOrderActionLoading(orderId);
      try {
         await adminApi.markOrderDelivered(orderId);
         await refreshOrders(orderId);
      } catch (err: any) {
         alert(err.message || 'Failed to mark as delivered');
      }
      setOrderActionLoading(null);
   };

   const handleCancelOrder = async () => {
      if (!cancelModal) return;
      setOrderActionLoading(cancelModal.orderId);
      try {
         const oid = cancelModal.orderId;
         await adminApi.cancelOrder(oid, cancelModal.reason || undefined);
         setCancelModal(null);
         await refreshOrders(oid);
      } catch (err: any) {
         alert(err.message || 'Failed to cancel order');
      }
      setOrderActionLoading(null);
   };

   const handleSaveOrderNotes = async () => {
      if (!orderNotesInput) return;
      try {
         const oid = orderNotesInput.orderId;
         await adminApi.updateOrderNotes(oid, orderNotesInput.notes);
         setOrderNotesInput(null);
         await refreshOrders(oid);
      } catch (err: any) {
         alert(err.message || 'Failed to save notes');
      }
   };

   const getOrderStatusColor = (status: string) => {
      const colors: Record<string, string> = {
         PENDING: 'bg-warm-gray/10 text-warm-gray border-warm-gray/30',
         PAID: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
         AWAITING_CONFIRMATION: 'bg-amber/10 text-amber border-amber/30',
         CONFIRMED: 'bg-tangerine/10 text-tangerine border-tangerine/30',
         SHIPPED: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
         DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/30',
         CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30',
      };
      return colors[status] || 'bg-warm-gray/10 text-warm-gray border-warm-gray/30';
   };

   const getOrderStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
         PENDING: 'Pending',
         PAID: 'Paid',
         AWAITING_CONFIRMATION: 'Awaiting Artist',
         CONFIRMED: 'Confirmed',
         SHIPPED: 'Shipped',
         DELIVERED: 'Delivered',
         CANCELLED: 'Cancelled',
      };
      return labels[status] || status;
   };

   const loadUsers = async (page = 1) => {
      setIsLoadingUsers(true);
      try {
         const roleFilter = userSubTab === 'COLLECTORS' ? 'USER' : userSubTab === 'ARTISTS' ? 'ARTIST' : undefined;
         const data = await adminApi.getUsers({
            search: debouncedSearch || undefined,
            role: roleFilter,
            page,
            limit: 20,
         });
         setUsers(data.users);
         setUsersPagination({ page: data.page, limit: 20, total: data.total, totalPages: data.totalPages });
         setUserCounts(data.counts);
      } catch (err) {
         console.error('Failed to load users', err);
      } finally {
         setIsLoadingUsers(false);
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
         const response = await fetch(`${API_URL}/admin/artists/pending`, {
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

    const handleApproveArtist = async (userId: string, force: boolean = false) => {
       setApprovingId(userId);
       try {
          const token = localStorage.getItem('authToken');
          const csrfToken = getCsrfToken();
          const forceParam = force ? '?force=true' : '';
          const response = await fetch(`${API_URL}/admin/artists/${userId}/approve${forceParam}`, {
             method: 'PUT',
             headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken })
             }
          });

         if (response.ok) {
            loadPendingArtists();
            loadUsers();
            loadStats();
         } else {
            const data = await response.json();
            if (data.message?.includes('email is not verified') && !force) {
               if (confirm('Artist email is not verified. Approve anyway? This will also verify their email.')) {
                  return handleApproveArtist(userId, true);
               }
            } else {
               alert(data.message || 'Failed to approve artist');
            }
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
          const csrfToken = getCsrfToken();
          const response = await fetch(`${API_URL}/admin/artists/${userId}/reject`, {
             method: 'PUT',
             headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken })
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

   // Debounce search input
   useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(userSearch), 300);
      return () => clearTimeout(timer);
   }, [userSearch]);

   useEffect(() => {
      if (activeTab === 'USERS') {
         loadUsers(1);
         if (userSubTab === 'PENDING') {
            loadPendingArtists();
         }
      }
   }, [activeTab, debouncedSearch, userSubTab]);

   // Load referral admin data
   useEffect(() => {
      if (activeTab === 'REFERRALS') {
         const loadReferralAdmin = async () => {
            setIsLoadingReferrals(true);
            try {
               const data = await adminApi.getReferralStats();
               setReferralStats({ totalReferredUsers: data.totalReferredUsers, totalReferrers: data.totalReferrers, topReferrers: data.topReferrers });
               setReferralConfig(data.config);
            } catch (err) {
               console.error('Failed to load referral data', err);
            } finally {
               setIsLoadingReferrals(false);
            }
         };
         loadReferralAdmin();
      }
   }, [activeTab]);

   useEffect(() => {
      if (activeTab === 'INVENTORY') loadArtists();
   }, [activeTab]);

   useEffect(() => {
      if (activeTab === 'LANDING PAGE') {
         fetchArtworks(); // Ensure artworks are loaded for the landing page selectors
      }
   }, [activeTab, fetchArtworks]);

   // Load reviews when REVIEWS tab is active
   useEffect(() => {
      const loadReviews = async () => {
         if (activeTab === 'REVIEWS') {
            setIsLoadingReviews(true);
            try {
               const { reviews: fetchedReviews } = await reviewApi.getAllForModeration(reviewFilter);
               setReviews(fetchedReviews);
            } catch (error) {
               console.error('Failed to fetch reviews:', error);
            } finally {
               setIsLoadingReviews(false);
            }
         }
      };
      loadReviews();
   }, [activeTab, reviewFilter]);

   // Sync landingForm with landingPageContent when it loads
   useEffect(() => {
      if (landingPageContent) {
         setLandingForm(landingPageContent);
      }
   }, [landingPageContent]);


   const handleUpdateUserRole = async (userId: string, newRole: string) => {
      if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
      try {
         await adminApi.updateUserRole(userId, newRole);
         loadUsers(); // Refresh list
         loadStats(); // Update stats
      } catch (err: any) {
         alert(err.message || 'Failed to update user role');
      }
   };

   const handleDeleteUser = async (userId: string, userName: string) => {
      if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return;
      try {
         await adminApi.deleteUser(userId);
         loadUsers(); // Refresh list
         loadStats(); // Update stats
      } catch (err: any) {
         alert(err.message || 'Failed to delete user');
      }
   };

   const handleSaveReferralConfig = async () => {
      setIsSavingReferralConfig(true);
      try {
         await settingsApi.updateSetting('referralConfig', referralConfig);
         alert('Referral program settings saved successfully');
      } catch (err: any) {
         alert(err.message || 'Failed to save referral config');
      } finally {
         setIsSavingReferralConfig(false);
      }
   };

   const toggleSort = (field: 'role' | 'createdAt') => {
      if (userSortField === field) {
         setUserSortDir(d => d === 'asc' ? 'desc' : 'asc');
      } else {
         setUserSortField(field);
         setUserSortDir('asc');
      }
   };

   const toggleInventorySort = (field: 'title' | 'price' | 'createdAt') => {
      if (inventorySortField === field) {
         setInventorySortDir(d => d === 'asc' ? 'desc' : 'asc');
      } else {
         setInventorySortField(field);
         setInventorySortDir('asc');
      }
   };

   const toggleOrderSort = (field: 'createdAt' | 'totalAmount' | 'status') => {
      if (orderSortField === field) {
         setOrderSortDir(d => d === 'asc' ? 'desc' : 'asc');
      } else {
         setOrderSortField(field);
         setOrderSortDir('asc');
      }
   };

   const sortedUsers = [...users].sort((a, b) => {
      const dir = userSortDir === 'asc' ? 1 : -1;
      if (userSortField === 'role') return a.role.localeCompare(b.role) * dir;
      if (userSortField === 'createdAt') return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      return 0;
   });

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
         setNewArtwork((prev: any) => ({ ...prev, imageUrl: url }));
      } catch (error) {
         console.error('Upload failed:', error);
         alert('Failed to upload image. Please try again.');
      } finally {
         setIsUploading(false);
      }
   };

   const handleSaveArtwork = async () => {
      if (!newArtwork.title || !newArtwork.price) {
         alert('Please fill in Title and Price');
         return;
      }
      if (!newArtwork.artistId) {
         alert('Please select an artist');
         return;
      }
      try {
         const artData = {
            ...newArtwork,
            imageUrl: newArtwork.imageUrl || `https://picsum.photos/800/800?random=${Date.now()}`,
            year: newArtwork.year || new Date().getFullYear(),
            dimensions: newArtwork.dimensions || '24x24',
            description: newArtwork.description || '',
            category: newArtwork.category || 'Abstract',
            medium: newArtwork.medium || 'Mixed Media',
            inStock: newArtwork.inStock ?? true
         };

         if (editingArtworkId) {
            await updateArtwork(editingArtworkId, artData);
         } else {
            await addArtwork(artData);
         }

         setIsAddModalOpen(false);
         setEditingArtworkId(null);
         setNewArtwork({
            title: '', artistId: '', artistName: '', price: 0, category: 'Abstract', medium: '', inStock: true,
            year: new Date().getFullYear(), dimensions: '', description: '', imageUrl: '',
            printOptions: { enabled: false, sizes: [] }
         });
      } catch (err) {
         alert(`Failed to ${editingArtworkId ? 'update' : 'add'} artwork`);
         console.error('Save artwork error:', err);
      }
   };

   const handleEditArtwork = (art: any) => {
      setEditingArtworkId(art.id);
      setNewArtwork({
         title: art.title,
         artistId: art.artistId,
         artistName: art.artistName,
         price: art.price,
         category: art.category,
         medium: art.medium,
         inStock: art.inStock,
         year: art.year,
         dimensions: art.dimensions,
         description: art.description,
         imageUrl: art.imageUrl,
         printOptions: art.printOptions || { enabled: false, sizes: [] }
      });
      setIsAddModalOpen(true);
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
         setNewExh({
            title: '', description: '', startDate: '', endDate: '', location: '', imageUrl: '',
            isVirtual: false, status: 'UPCOMING', galleryImages: [], videoUrl: '', virtualUrl: '', venueName: ''
         });
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
         location: ex.location || '',
         imageUrl: ex.imageUrl,
         isVirtual: ex.isVirtual,
         status: ex.status,
         galleryImages: ex.galleryImages || [],
         videoUrl: ex.videoUrl || '',
         virtualUrl: ex.virtualUrl || '',
         venueName: ex.venueName || ''
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

   // -- Render Helpers ---
   const TabButton = ({ tab, active, onClick }: { tab: string; active: boolean; onClick: () => void }) => (
      <button
         onClick={onClick}
         className={cn(
            "text-xs font-bold px-6 py-2 uppercase tracking-widest transition-all whitespace-nowrap border rounded-sm",
            active
               ? "bg-pearl text-void border-pearl high-contrast:bg-black high-contrast:text-white high-contrast:border-black"
               : "bg-transparent text-warm-gray border-pearl/10 hover:bg-tangerine/10 hover:border-tangerine hover:text-tangerine high-contrast:text-black high-contrast:border-black/50"
         )}
      >
         {tab}
      </button>
   );

   const StatCard = ({ label, value, icon, sub }: { label: string; value: string | number; icon: React.ReactNode; sub?: string }) => (
      <div className="bg-charcoal/50 border border-pearl/10 p-6 relative group overflow-hidden">
         <div className="absolute top-0 right-0 p-4 text-warm-gray/20 group-hover:text-tangerine/20 transition-colors">
            {icon}
         </div>
         <p className="text-warm-gray text-xs uppercase tracking-widest mb-2">{label}</p>
         <h3 className="text-3xl font-display text-pearl high-contrast:text-black">{value}</h3>
         {sub && <p className="text-tangerine text-xs mt-2 font-mono">{sub}</p>}
      </div>
   );

   return (
      <div className="pt-32 px-6 md:px-12 max-w-[1920px] mx-auto min-h-screen pb-12">
         {/* Introduction */}
         <div className="mb-12 border-b border-pearl/10 pb-8 high-contrast:border-black/20">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-pearl high-contrast:text-black mb-2">
               DASHBOARD
            </h1>
            <p className="text-tangerine font-mono text-sm tracking-widest uppercase high-contrast:text-[#D35400]">
               System Administration
            </p>
         </div>

         {/* Tabs */}
         <div className="flex flex-wrap gap-2 mb-12 border-b border-pearl/10 pb-8 overflow-x-auto">
            {['OVERVIEW', 'INVENTORY', 'ORDERS', 'SHIPPING', 'USERS', 'REVIEWS', 'FINANCE', 'EXHIBITIONS', 'REFERRALS', 'LANDING PAGE', 'THEME'].map(tab => (
               <TabButton key={tab} tab={tab} active={activeTab === tab} onClick={() => setActiveTab(tab as any)} />
            ))}
         </div>

         {/* OVERVIEW TAB */}
         {activeTab === 'OVERVIEW' && (
            <div className="space-y-8 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Total Revenue" value={convertPrice(stats?.totalRevenue || 0)} icon={<DollarSign size={48} />} />
                  <StatCard label="Active Users" value={stats?.totalUsers || 0} icon={<Users size={48} />} />
                  <StatCard label="Artworks" value={stats?.totalArtworks || 0} icon={<Package size={48} />} />
                  <StatCard label="Orders" value={stats?.totalOrders || 0} sub={`${stats?.pendingOrders || 0} NEW`} icon={<Truck size={48} />} />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-charcoal/30 border border-pearl/10 p-6">
                     <h3 className="text-pearl font-display text-xl mb-6">Recent Activity</h3>
                     <ul className="space-y-4">
                        {recentOrders.map((o: any) => (
                           <li key={o.id} className="flex justify-between items-center border-b border-pearl/5 pb-2 text-sm">
                              <span className="text-warm-gray">New order from <strong className="text-pearl">{o.user?.fullName || o.customerName}</strong></span>
                              <span className="text-xs font-mono text-tangerine">{new Date(o.createdAt).toLocaleDateString()}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="bg-charcoal/30 border border-pearl/10 p-6 flex flex-col items-center justify-center text-center">
                     <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${stripeConnected ? 'bg-green-500/20 text-green-500' : 'bg-warm-gray/10 text-warm-gray'}`}>
                        <CreditCard size={32} />
                     </div>
                     <h3 className="text-pearl font-display text-xl mb-1">Stripe Status</h3>
                     <p className="text-warm-gray text-sm mb-4">{stripeConnected ? 'Connected & Active' : 'Setup Required'}</p>
                     {!stripeConnected && (
                        <Button variant="primary" onClick={connectStripe}>Connect Stripe</Button>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* INVENTORY TAB */}
         {activeTab === 'INVENTORY' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-display text-pearl">Inventory</h3>
                  <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                     <Plus size={16} className="mr-2" /> Add Artwork
                  </Button>
               </div>

               {/* Search */}
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                  <input
                     type="text"
                     placeholder="Search artworks..."
                     value={inventorySearch}
                     onChange={e => setInventorySearch(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 bg-charcoal/50 border border-pearl/10 text-pearl text-sm placeholder:text-warm-gray/50 focus:border-tangerine/50 focus:outline-none"
                  />
               </div>

               {/* Filter Chips */}
               <div className="flex flex-wrap gap-2">
                  {['ALL', ...availableCategories].map(cat => (
                     <button
                        key={cat}
                        onClick={() => setInventoryCategory(cat)}
                        className={`px-4 py-2 border text-xs uppercase tracking-widest transition-all ${inventoryCategory === cat
                           ? 'border-tangerine text-tangerine bg-tangerine/10'
                           : 'border-pearl/10 text-warm-gray bg-charcoal/30 hover:bg-tangerine/10 hover:border-tangerine hover:text-tangerine'
                        }`}
                     >
                        {cat}
                     </button>
                  ))}
                  <span className="w-px bg-pearl/10 mx-1" />
                  {(['ALL', 'IN_STOCK', 'SOLD_OUT'] as const).map(st => (
                     <button
                        key={st}
                        onClick={() => setInventoryStock(st)}
                        className={`px-4 py-2 border text-xs uppercase tracking-widest transition-all ${inventoryStock === st
                           ? 'border-tangerine text-tangerine bg-tangerine/10'
                           : 'border-pearl/10 text-warm-gray bg-charcoal/30 hover:bg-tangerine/10 hover:border-tangerine hover:text-tangerine'
                        }`}
                     >
                        {st === 'ALL' ? 'All Stock' : st === 'IN_STOCK' ? 'In Stock' : 'Sold Out'}
                     </button>
                  ))}
               </div>

               {/* Artworks Table */}
               <div className="border border-pearl/10 rounded overflow-hidden">
                  {isLoadingInventory ? (
                     <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-tangerine" />
                        <span className="ml-3 text-warm-gray text-sm">Loading artworks...</span>
                     </div>
                  ) : (
                  <table className="w-full text-left text-sm">
                     <thead className="bg-charcoal text-warm-gray font-mono text-xs uppercase border-b border-pearl/10">
                        <tr>
                           <th className="p-4 cursor-pointer hover:text-tangerine select-none" onClick={() => toggleInventorySort('title')}>
                              <span className="flex items-center gap-1">Artwork {inventorySortField === 'title' && (inventorySortDir === 'asc' ? '↑' : '↓')}</span>
                           </th>
                           <th className="p-4">Artist</th>
                           <th className="p-4 cursor-pointer hover:text-tangerine select-none" onClick={() => toggleInventorySort('price')}>
                              <span className="flex items-center gap-1">Price {inventorySortField === 'price' && (inventorySortDir === 'asc' ? '↑' : '↓')}</span>
                           </th>
                           <th className="p-4">Status</th>
                           <th className="p-4 cursor-pointer hover:text-tangerine select-none" onClick={() => toggleInventorySort('createdAt')}>
                              <span className="flex items-center gap-1">Added {inventorySortField === 'createdAt' && (inventorySortDir === 'asc' ? '↑' : '↓')}</span>
                           </th>
                           <th className="p-4">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-pearl/5">
                        {inventoryArtworks.map((art: any) => (
                           <tr key={art.id} className="hover:bg-pearl/5 transition-colors">
                              <td className="p-4">
                                 <div className="flex items-center gap-3">
                                    <img src={art.imageUrl} className="w-10 h-10 object-cover border border-pearl/20" alt="" />
                                    <div>
                                       <span className="text-pearl font-medium">{art.title}</span>
                                       <div className="text-xs text-warm-gray">{art.category}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-4 text-warm-gray">{art.artistName}</td>
                              <td className="p-4 text-tangerine font-mono">{convertPrice(art.price)}</td>
                              <td className="p-4">
                                 <button
                                    onClick={() => { updateArtwork(art.id, { inStock: !art.inStock }); setTimeout(() => loadInventory(inventoryPagination.page), 500); }}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border ${art.inStock ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}
                                 >
                                    {art.inStock ? 'In Stock' : 'Sold Out'}
                                 </button>
                              </td>
                              <td className="p-4 text-warm-gray text-xs font-mono">
                                 {art.createdAt ? format(new Date(art.createdAt), 'MMM d, yyyy') : '-'}
                              </td>
                              <td className="p-4">
                                 <div className="flex gap-2">
                                    <button onClick={() => handleEditArtwork(art)} className="text-warm-gray hover:text-tangerine transition-colors">
                                       <Edit size={16} />
                                    </button>
                                    <button onClick={() => { deleteArtwork(art.id); setTimeout(() => loadInventory(inventoryPagination.page), 500); }} className="text-warm-gray hover:text-tangerine transition-colors">
                                       <Trash2 size={16} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                        {inventoryArtworks.length === 0 && (
                           <tr><td colSpan={6} className="p-8 text-center text-warm-gray">No artworks found</td></tr>
                        )}
                     </tbody>
                  </table>
                  )}

                  {/* Pagination */}
                  {inventoryPagination.totalPages > 1 && !isLoadingInventory && (
                     <div className="flex items-center justify-between px-4 py-3 border-t border-pearl/10">
                        <span className="text-xs text-warm-gray font-mono">
                           Showing {((inventoryPagination.page - 1) * 20) + 1}–{Math.min(inventoryPagination.page * 20, inventoryPagination.total)} of {inventoryPagination.total}
                        </span>
                        <div className="flex gap-2">
                           <button
                              disabled={inventoryPagination.page <= 1}
                              onClick={() => loadInventory(inventoryPagination.page - 1)}
                              className="px-3 py-1 text-xs border border-pearl/20 text-warm-gray hover:text-tangerine hover:border-tangerine transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                              Previous
                           </button>
                           <span className="px-3 py-1 text-xs text-warm-gray font-mono">
                              {inventoryPagination.page} / {inventoryPagination.totalPages}
                           </span>
                           <button
                              disabled={inventoryPagination.page >= inventoryPagination.totalPages}
                              onClick={() => loadInventory(inventoryPagination.page + 1)}
                              className="px-3 py-1 text-xs border border-pearl/20 text-warm-gray hover:text-tangerine hover:border-tangerine transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                              Next
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* ORDERS TAB */}
         {activeTab === 'ORDERS' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-display text-pearl">Order Management</h3>
               </div>

               {/* Search */}
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                  <input
                     type="text"
                     placeholder="Search by customer name or email..."
                     value={orderSearch}
                     onChange={e => setOrderSearch(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && loadAdminOrders()}
                     className="w-full pl-10 pr-4 py-2.5 bg-charcoal/50 border border-pearl/10 text-pearl text-sm placeholder:text-warm-gray/50 focus:border-tangerine/50 focus:outline-none"
                  />
               </div>

               {/* Order Status Chips */}
               <div className="flex flex-wrap gap-2">
                  {['ALL', ...ORDER_STATUSES].map(s => (
                     <button
                        key={s}
                        onClick={() => setOrderStatusFilter(s)}
                        className={`px-4 py-2 border text-xs uppercase tracking-widest transition-all ${orderStatusFilter === s
                           ? 'border-tangerine text-tangerine bg-tangerine/10'
                           : 'border-pearl/10 text-warm-gray bg-charcoal/30 hover:bg-tangerine/10 hover:border-tangerine hover:text-tangerine'
                        }`}
                     >
                        {s === 'ALL' ? 'All' : getOrderStatusLabel(s)}
                     </button>
                  ))}
               </div>

               <div className="border border-pearl/10 rounded overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-charcoal text-warm-gray font-mono text-xs uppercase border-b border-pearl/10">
                        <tr>
                           <th className="p-4">ID</th>
                           <th className="p-4">Customer</th>
                           <th className="p-4 cursor-pointer hover:text-tangerine select-none" onClick={() => toggleOrderSort('totalAmount')}>
                              <span className="flex items-center gap-1">Total {orderSortField === 'totalAmount' && (orderSortDir === 'asc' ? '↑' : '↓')}</span>
                           </th>
                           <th className="p-4 cursor-pointer hover:text-tangerine select-none" onClick={() => toggleOrderSort('status')}>
                              <span className="flex items-center gap-1">Status {orderSortField === 'status' && (orderSortDir === 'asc' ? '↑' : '↓')}</span>
                           </th>
                           <th className="p-4 cursor-pointer hover:text-tangerine select-none" onClick={() => toggleOrderSort('createdAt')}>
                              <span className="flex items-center gap-1">Date {orderSortField === 'createdAt' && (orderSortDir === 'asc' ? '↑' : '↓')}</span>
                           </th>
                           <th className="p-4">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-pearl/5">
                        {adminOrders.map(order => (
                           <tr key={order.id} className="hover:bg-pearl/5 transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                              <td className="p-4 font-mono text-tangerine">#{order.id.slice(-6).toUpperCase()}</td>
                              <td className="p-4 text-pearl">
                                 <div>{order.user?.fullName || 'Guest'}</div>
                                 <div className="text-xs text-warm-gray">{order.user?.email}</div>
                              </td>
                              <td className="p-4 text-pearl font-mono">{parseFloat(order.totalAmount).toLocaleString()} PKR</td>
                              <td className="p-4">
                                 <span className={`inline-block px-2 py-1 border text-[10px] font-bold uppercase tracking-wider ${getOrderStatusColor(order.status)}`}>
                                    {getOrderStatusLabel(order.status)}
                                 </span>
                              </td>
                              <td className="p-4 text-warm-gray text-xs">{format(new Date(order.createdAt), 'MMM d, yyyy')}</td>
                              <td className="p-4" onClick={e => e.stopPropagation()}>
                                 <div className="flex gap-2">
                                    {order.status === 'PENDING' && (
                                       <button onClick={() => handleMarkAsPaid(order.id)} className="text-blue-400 hover:text-tangerine transition-colors" title="Mark as Paid" disabled={orderActionLoading === order.id}><DollarSign size={16} /></button>
                                    )}
                                    {order.status === 'PAID' && (
                                       <button onClick={() => handleRequestArtistConfirmation(order.id)} className="text-amber hover:text-tangerine transition-colors" title="Request Artist Confirmation" disabled={orderActionLoading === order.id}><Mail size={16} /></button>
                                    )}
                                    {order.status === 'AWAITING_CONFIRMATION' && (
                                       <button onClick={() => handleAdminConfirm(order.id)} className="text-green-400 hover:text-tangerine transition-colors" title="Confirm Order" disabled={orderActionLoading === order.id}><Check size={16} /></button>
                                    )}
                                    {order.status === 'CONFIRMED' && (
                                       <button onClick={() => setShipModal({ orderId: order.id, trackingNumber: '', carrier: '', notes: '' })} className="text-purple-400 hover:text-tangerine transition-colors" title="Ship Order"><Truck size={16} /></button>
                                    )}
                                    {order.status === 'SHIPPED' && (
                                       <button onClick={() => handleDeliverOrder(order.id)} className="text-green-400 hover:text-tangerine transition-colors" title="Mark Delivered" disabled={orderActionLoading === order.id}><Check size={16} /></button>
                                    )}
                                    {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                                       <button onClick={() => setCancelModal({ orderId: order.id, reason: '' })} className="text-red-400 hover:text-tangerine transition-colors" title="Cancel Order"><X size={16} /></button>
                                    )}
                                    <button onClick={() => setOrderNotesInput({ orderId: order.id, notes: order.adminNotes || '' })} className="text-warm-gray hover:text-tangerine transition-colors" title="Admin Notes"><Edit size={16} /></button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                        {adminOrders.length === 0 && (
                           <tr><td colSpan={6} className="p-8 text-center text-warm-gray">No orders found</td></tr>
                        )}
                     </tbody>
                  </table>

                  {/* Pagination */}
                  {ordersPagination.totalPages > 1 && (
                     <div className="flex items-center justify-between px-4 py-3 border-t border-pearl/10">
                        <span className="text-xs text-warm-gray font-mono">
                           Showing {((ordersPagination.page - 1) * 20) + 1}–{Math.min(ordersPagination.page * 20, ordersPagination.total)} of {ordersPagination.total}
                        </span>
                        <div className="flex gap-2">
                           <button
                              disabled={ordersPagination.page <= 1}
                              onClick={() => loadAdminOrders(ordersPagination.page - 1)}
                              className="px-3 py-1 text-xs border border-pearl/20 text-warm-gray hover:text-tangerine hover:border-tangerine transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                              Previous
                           </button>
                           <span className="px-3 py-1 text-xs text-warm-gray font-mono">
                              {ordersPagination.page} / {ordersPagination.totalPages}
                           </span>
                           <button
                              disabled={ordersPagination.page >= ordersPagination.totalPages}
                              onClick={() => loadAdminOrders(ordersPagination.page + 1)}
                              className="px-3 py-1 text-xs border border-pearl/20 text-warm-gray hover:text-tangerine hover:border-tangerine transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                              Next
                           </button>
                        </div>
                     </div>
                  )}
               </div>

               {/* Order Detail Modal */}
               {selectedOrder && (
                  <div className="fixed inset-0 z-50 bg-void/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                     <div className="bg-charcoal border border-pearl/20 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-pearl/10">
                           <div>
                              <h3 className="text-xl font-display text-pearl">Order #{selectedOrder.id.slice(-6).toUpperCase()}</h3>
                              <p className="text-warm-gray text-xs mt-1">{format(new Date(selectedOrder.createdAt), 'MMM d, yyyy h:mm a')}</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-wider ${getOrderStatusColor(selectedOrder.status)}`}>
                                 {getOrderStatusLabel(selectedOrder.status)}
                              </span>
                              <button onClick={() => setSelectedOrder(null)} className="text-warm-gray hover:text-tangerine"><X size={20} /></button>
                           </div>
                        </div>

                        <div className="p-6 space-y-6">
                           {/* Actions Bar */}
                           {!['DELIVERED', 'CANCELLED'].includes(selectedOrder.status) && (
                              <div className="bg-void/50 border border-pearl/10 p-4">
                                 <h4 className="text-xs text-warm-gray uppercase tracking-widest mb-3">Change Status</h4>
                                 <div className="flex flex-wrap gap-2">
                                    {selectedOrder.status === 'PENDING' && (
                                       <button
                                          onClick={() => { handleMarkAsPaid(selectedOrder.id); }}
                                          disabled={orderActionLoading === selectedOrder.id}
                                          className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs uppercase tracking-widest hover:bg-tangerine/20 hover:text-tangerine hover:border-tangerine transition-colors disabled:opacity-50 flex items-center gap-2"
                                       >
                                          <DollarSign size={14} /> Mark as Paid
                                       </button>
                                    )}
                                    {selectedOrder.status === 'PAID' && (
                                       <button
                                          onClick={() => { handleRequestArtistConfirmation(selectedOrder.id); }}
                                          disabled={orderActionLoading === selectedOrder.id}
                                          className="px-4 py-2 bg-amber/10 border border-amber/30 text-amber text-xs uppercase tracking-widest hover:bg-tangerine/20 hover:text-tangerine hover:border-tangerine transition-colors disabled:opacity-50 flex items-center gap-2"
                                       >
                                          <Mail size={14} /> Request Artist Confirmation
                                       </button>
                                    )}
                                    {selectedOrder.status === 'AWAITING_CONFIRMATION' && (
                                       <button
                                          onClick={() => { handleAdminConfirm(selectedOrder.id); }}
                                          disabled={orderActionLoading === selectedOrder.id}
                                          className="px-4 py-2 bg-tangerine/10 border border-tangerine/30 text-tangerine text-xs uppercase tracking-widest hover:bg-tangerine/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                       >
                                          <Check size={14} /> Confirm Order
                                       </button>
                                    )}
                                    {selectedOrder.status === 'CONFIRMED' && (
                                       <button
                                          onClick={() => { setSelectedOrder(null); setShipModal({ orderId: selectedOrder.id, trackingNumber: '', carrier: '', notes: '' }); }}
                                          className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs uppercase tracking-widest hover:bg-tangerine/20 hover:text-tangerine hover:border-tangerine transition-colors flex items-center gap-2"
                                       >
                                          <Truck size={14} /> Ship Order
                                       </button>
                                    )}
                                    {selectedOrder.status === 'SHIPPED' && (
                                       <button
                                          onClick={() => { handleDeliverOrder(selectedOrder.id); }}
                                          disabled={orderActionLoading === selectedOrder.id}
                                          className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 text-xs uppercase tracking-widest hover:bg-tangerine/20 hover:text-tangerine hover:border-tangerine transition-colors disabled:opacity-50 flex items-center gap-2"
                                       >
                                          <Check size={14} /> Mark Delivered
                                       </button>
                                    )}
                                    <button
                                       onClick={() => { setSelectedOrder(null); setCancelModal({ orderId: selectedOrder.id, reason: '' }); }}
                                       className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs uppercase tracking-widest hover:bg-tangerine/20 hover:text-tangerine hover:border-tangerine transition-colors flex items-center gap-2"
                                    >
                                       <X size={14} /> Cancel
                                    </button>
                                    <button
                                       onClick={() => { setSelectedOrder(null); setOrderNotesInput({ orderId: selectedOrder.id, notes: selectedOrder.adminNotes || '' }); }}
                                       className="px-4 py-2 border border-pearl/20 text-warm-gray text-xs uppercase tracking-widest hover:bg-tangerine/10 hover:text-tangerine hover:border-tangerine transition-colors flex items-center gap-2"
                                    >
                                       <Edit size={14} /> Notes
                                    </button>
                                 </div>
                              </div>
                           )}

                           {/* Status History Timeline */}
                           <div>
                              <h4 className="text-xs text-warm-gray uppercase tracking-widest mb-3">Order Timeline</h4>
                              <div className="relative pl-6 space-y-0">
                                 {[
                                    { label: 'Order Placed', date: selectedOrder.createdAt, always: true },
                                    { label: 'Payment Received', date: selectedOrder.paidAt },
                                    { label: 'Artist Notified', date: selectedOrder.artistNotifiedAt },
                                    { label: 'Artist Confirmed', date: selectedOrder.artistConfirmedAt },
                                    { label: 'Admin Confirmed', date: selectedOrder.adminConfirmedAt },
                                    { label: 'Shipped', date: selectedOrder.shippedAt, extra: selectedOrder.trackingNumber ? `Tracking: ${selectedOrder.trackingNumber}` : undefined },
                                    { label: 'Delivered', date: selectedOrder.deliveredAt },
                                    { label: 'Cancelled', date: selectedOrder.cancelledAt, extra: selectedOrder.cancellationReason, isError: true },
                                 ].filter(e => e.date || e.always).map((event, idx, arr) => (
                                    <div key={idx} className="relative pb-4">
                                       {/* Vertical line */}
                                       {idx < arr.length - 1 && (
                                          <div className={`absolute left-[-17px] top-3 w-px h-full ${event.date ? (event.isError ? 'bg-red-500/30' : 'bg-tangerine/30') : 'bg-pearl/10'}`} />
                                       )}
                                       {/* Dot */}
                                       <div className={`absolute left-[-20px] top-1.5 w-[7px] h-[7px] rounded-full border ${
                                          event.date
                                             ? event.isError ? 'bg-red-500 border-red-500' : 'bg-tangerine border-tangerine'
                                             : 'bg-charcoal border-pearl/30'
                                       }`} />
                                       <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                          <span className={`text-xs font-medium ${event.date ? (event.isError ? 'text-red-400' : 'text-pearl') : 'text-warm-gray/40'}`}>
                                             {event.label}
                                          </span>
                                          {event.date && (
                                             <span className="text-warm-gray text-[10px] font-mono">
                                                {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                                             </span>
                                          )}
                                       </div>
                                       {event.extra && (
                                          <p className={`text-[11px] mt-0.5 ${event.isError ? 'text-red-400/70' : 'text-warm-gray/60'}`}>{event.extra}</p>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           </div>

                           {/* Customer */}
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div>
                                 <h4 className="text-xs text-warm-gray uppercase tracking-widest mb-2">Customer</h4>
                                 <p className="text-pearl">{selectedOrder.user?.fullName || 'Guest'}</p>
                                 <p className="text-warm-gray text-sm">{selectedOrder.user?.email}</p>
                                 {selectedOrder.user?.phoneNumber && (
                                    <p className="text-warm-gray text-sm">{selectedOrder.user.phoneNumber}</p>
                                 )}
                              </div>
                              {selectedOrder.shippingAddress && (
                                 <div>
                                    <h4 className="text-xs text-warm-gray uppercase tracking-widest mb-2">Shipping Address</h4>
                                    <p className="text-pearl text-sm">{selectedOrder.shippingAddress}</p>
                                 </div>
                              )}
                           </div>

                           {/* Items */}
                           <div>
                              <h4 className="text-xs text-warm-gray uppercase tracking-widest mb-3">Items</h4>
                              <div className="space-y-3">
                                 {(selectedOrder.items || []).map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 bg-void/50 p-3 border border-pearl/10">
                                       {item.artwork?.imageUrl && (
                                          <img src={item.artwork.imageUrl} alt={item.artwork?.title || 'Artwork'} className="w-16 h-16 object-cover border border-pearl/10" />
                                       )}
                                       <div className="flex-1 min-w-0">
                                          <p className="text-pearl text-sm font-medium truncate">{item.artwork?.title || 'Unknown Artwork'}</p>
                                          <p className="text-warm-gray text-xs">
                                             Qty: {item.quantity} {item.type === 'PRINT' ? `(Print - ${item.printSize})` : '(Original)'}
                                             {item.artwork?.artist?.user?.fullName && <span className="ml-2 text-tangerine">by {item.artwork.artist.user.fullName}</span>}
                                          </p>
                                       </div>
                                       <p className="text-pearl font-mono text-sm">{parseFloat(item.price).toLocaleString()} PKR</p>
                                    </div>
                                 ))}
                              </div>
                           </div>

                           {/* Tracking */}
                           {selectedOrder.trackingNumber && (
                              <div className="bg-purple-500/5 border border-purple-500/20 p-4">
                                 <h4 className="text-xs text-purple-400 uppercase tracking-widest mb-2">Shipping & Tracking</h4>
                                 <p className="text-pearl font-mono text-sm">{selectedOrder.trackingNumber}</p>
                                 {selectedOrder.carrier && <p className="text-warm-gray text-xs mt-1">Carrier: {selectedOrder.carrier}</p>}
                              </div>
                           )}

                           {/* Notes */}
                           {selectedOrder.adminNotes && (
                              <div>
                                 <h4 className="text-xs text-warm-gray uppercase tracking-widest mb-2">Admin Notes</h4>
                                 <p className="text-warm-gray text-sm bg-void/30 p-3 border border-pearl/10">{selectedOrder.adminNotes}</p>
                              </div>
                           )}

                           {/* Total */}
                           <div className="flex justify-between items-center pt-4 border-t border-pearl/10">
                              <span className="text-warm-gray uppercase text-xs tracking-widest">Total</span>
                              <span className="text-pearl font-mono text-xl">{parseFloat(selectedOrder.totalAmount).toLocaleString()} PKR</span>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Ship Order Modal */}
               {shipModal && (
                  <div className="fixed inset-0 z-50 bg-void/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShipModal(null)}>
                     <div className="bg-charcoal border border-pearl/20 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-display text-pearl mb-6">Ship Order</h3>
                        <div className="space-y-4">
                           <div>
                              <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Tracking Number *</label>
                              <input
                                 type="text"
                                 value={shipModal.trackingNumber}
                                 onChange={e => setShipModal({ ...shipModal, trackingNumber: e.target.value })}
                                 className="w-full bg-void border border-pearl/20 text-pearl p-3 text-sm focus:border-tangerine focus:outline-none"
                                 placeholder="Enter tracking number"
                              />
                           </div>
                           <div>
                              <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Carrier</label>
                              <input
                                 type="text"
                                 value={shipModal.carrier}
                                 onChange={e => setShipModal({ ...shipModal, carrier: e.target.value })}
                                 className="w-full bg-void border border-pearl/20 text-pearl p-3 text-sm focus:border-tangerine focus:outline-none"
                                 placeholder="e.g. DHL, TCS, Leopards"
                              />
                           </div>
                           <div>
                              <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Notes</label>
                              <textarea
                                 value={shipModal.notes}
                                 onChange={e => setShipModal({ ...shipModal, notes: e.target.value })}
                                 className="w-full bg-void border border-pearl/20 text-pearl p-3 text-sm focus:border-tangerine focus:outline-none h-20 resize-none"
                                 placeholder="Optional notes..."
                              />
                           </div>
                           <div className="flex gap-3 pt-2">
                              <button onClick={() => setShipModal(null)} className="flex-1 py-3 border border-pearl/20 text-pearl text-xs uppercase tracking-widest hover:text-tangerine hover:border-tangerine transition-colors">Cancel</button>
                              <button
                                 onClick={handleShipOrder}
                                 disabled={!shipModal.trackingNumber || orderActionLoading === shipModal.orderId}
                                 className="flex-1 py-3 bg-tangerine text-void text-xs uppercase tracking-widest hover:bg-tangerine/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                 <Truck size={14} /> Ship Order
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Cancel Order Modal */}
               {cancelModal && (
                  <div className="fixed inset-0 z-50 bg-void/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setCancelModal(null)}>
                     <div className="bg-charcoal border border-pearl/20 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-display text-red-400 mb-6">Cancel Order</h3>
                        <div className="space-y-4">
                           <div>
                              <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Reason (optional)</label>
                              <textarea
                                 value={cancelModal.reason}
                                 onChange={e => setCancelModal({ ...cancelModal, reason: e.target.value })}
                                 className="w-full bg-void border border-pearl/20 text-pearl p-3 text-sm focus:border-red-500 focus:outline-none h-24 resize-none"
                                 placeholder="Reason for cancellation..."
                              />
                           </div>
                           <div className="flex gap-3 pt-2">
                              <button onClick={() => setCancelModal(null)} className="flex-1 py-3 border border-pearl/20 text-pearl text-xs uppercase tracking-widest hover:text-tangerine hover:border-tangerine transition-colors">Back</button>
                              <button
                                 onClick={handleCancelOrder}
                                 disabled={orderActionLoading === cancelModal.orderId}
                                 className="flex-1 py-3 bg-red-500 text-white text-xs uppercase tracking-widest hover:bg-tangerine hover:text-void transition-colors disabled:opacity-50"
                              >
                                 Confirm Cancel
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Admin Notes Modal */}
               {orderNotesInput && (
                  <div className="fixed inset-0 z-50 bg-void/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOrderNotesInput(null)}>
                     <div className="bg-charcoal border border-pearl/20 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-display text-pearl mb-6">Admin Notes</h3>
                        <div className="space-y-4">
                           <textarea
                              value={orderNotesInput.notes}
                              onChange={e => setOrderNotesInput({ ...orderNotesInput, notes: e.target.value })}
                              className="w-full bg-void border border-pearl/20 text-pearl p-3 text-sm focus:border-tangerine focus:outline-none h-32 resize-none"
                              placeholder="Internal notes about this order..."
                           />
                           <div className="flex gap-3 pt-2">
                              <button onClick={() => setOrderNotesInput(null)} className="flex-1 py-3 border border-pearl/20 text-pearl text-xs uppercase tracking-widest hover:text-tangerine hover:border-tangerine transition-colors">Cancel</button>
                              <button onClick={handleSaveOrderNotes} className="flex-1 py-3 bg-tangerine text-void text-xs uppercase tracking-widest hover:bg-tangerine/80 transition-colors flex items-center justify-center gap-2">
                                 <Save size={14} /> Save Notes
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}

         {/* Other tabs would follow similar massive restyling. For brevity in this agent turn, I'm providing the core structure. */}
         {/* EXHIBITIONS TAB REIMPLEMENTATION */}
         {activeTab === 'EXHIBITIONS' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-display text-pearl">Exhibitions</h3>
                  <Button variant="primary" onClick={() => setIsExhModalOpen(true)}>
                     <Plus size={16} className="mr-2" /> New Exhibition
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {exhibitions.map((ex: any) => (
                     <div key={ex.id} className="group relative border border-pearl/10 bg-charcoal/30 overflow-hidden hover:border-tangerine transition-colors duration-300">
                        <div className="h-32 relative overflow-hidden">
                           <img src={ex.imageUrl} alt={ex.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                           <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-widest bg-void border ${ex.status === 'CURRENT' ? 'border-tangerine text-tangerine' : 'border-warm-gray text-warm-gray'}`}>
                              {ex.status}
                           </div>
                        </div>
                        <div className="p-3">
                           <h4 className="font-display text-sm font-medium text-pearl mb-0.5 truncate">{ex.title}</h4>
                           <p className="text-warm-gray text-[10px] mb-0.5">{format(new Date(ex.startDate), 'MMM d, yyyy')}</p>
                           {ex.location && <p className="text-warm-gray/60 text-[10px] mb-2 truncate">{ex.location}</p>}
                           <div className="flex gap-1.5">
                              <button onClick={() => handleEditExhibition(ex)} className="flex-1 py-1.5 text-[10px] border border-pearl/20 text-pearl hover:text-tangerine hover:border-tangerine transition-colors uppercase tracking-widest">Edit</button>
                              <button onClick={() => deleteExhibition(ex.id)} className="px-2 border border-pearl/20 text-warm-gray hover:border-tangerine hover:text-tangerine"><Trash2 size={12} /></button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* SHIPPING TAB */}
         {activeTab === 'SHIPPING' && (
            <div className="space-y-6 animate-fade-in max-w-3xl">
               <h3 className="text-2xl font-display text-pearl">Logistics Configuration</h3>

               <div className="border border-pearl/10 bg-charcoal/30 p-6">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <Truck className="text-tangerine" size={24} />
                        <div>
                           <h4 className="text-pearl font-bold">DHL Integration</h4>
                           <p className="text-warm-gray text-xs">Automated shipping calculations</p>
                        </div>
                     </div>
                     <button
                        onClick={() => updateShippingConfig({ ...shippingConfig, enableDHL: !shippingConfig.enableDHL })}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${shippingConfig.enableDHL ? 'bg-tangerine' : 'bg-warm-gray/20'}`}
                     >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${shippingConfig.enableDHL ? 'translate-x-6' : ''}`} />
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div className="opacity-50 pointer-events-none filter blur-[1px]">
                        <label className="text-xs uppercase tracking-widest text-warm-gray mb-2 block">DHL API Key</label>
                        <input
                           disabled
                           type="password"
                           value="****************"
                           className="w-full bg-void border border-pearl/20 p-3 text-warm-gray font-mono text-sm"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="text-xs uppercase tracking-widest text-warm-gray mb-2 block">Domestic Flat Rate (PKR)</label>
                           <input
                              type="number"
                              value={shippingConfig.domesticRate}
                              onChange={(e) => updateShippingConfig({ ...shippingConfig, domesticRate: Number(e.target.value) })}
                              className="w-full bg-void border border-pearl/20 p-3 text-pearl font-mono text-sm focus:border-tangerine outline-none"
                           />
                        </div>
                        <div>
                           <label className="text-xs uppercase tracking-widest text-warm-gray mb-2 block">Int'l Flat Rate (USD)</label>
                           <input
                              type="number"
                              value={shippingConfig.internationalRate}
                              onChange={(e) => updateShippingConfig({ ...shippingConfig, internationalRate: Number(e.target.value) })}
                              className="w-full bg-void border border-pearl/20 p-3 text-pearl font-mono text-sm focus:border-tangerine outline-none"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* FINANCE TAB */}
         {activeTab === 'FINANCE' && (
            <div className="space-y-6 animate-fade-in">
               <h3 className="text-2xl font-display text-pearl">Financial Overview</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-charcoal/30 border border-pearl/10 p-8 flex flex-col items-center justify-center text-center">
                     <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${stripeConnected ? 'bg-green-500/20 text-green-500' : 'bg-warm-gray/10 text-warm-gray'}`}>
                        <CreditCard size={40} />
                     </div>
                     <h4 className="text-pearl font-display text-lg mb-2">Stripe Connect</h4>
                     <p className="text-warm-gray text-sm mb-6 max-w-xs">{stripeConnected ? 'Your account is fully connected and ready to receive payouts.' : 'Connect your Stripe account to start accepting payments directly.'}</p>

                     {stripeConnected ? (
                        <div className="w-full bg-void border border-pearl/10 p-4 rounded text-left">
                           <div className="flex justify-between text-sm mb-2">
                              <span className="text-warm-gray">Account Status</span>
                              <span className="text-green-500 font-bold uppercase text-xs tracking-wider">Active</span>
                           </div>
                           <div className="flex justify-between text-sm">
                              <span className="text-warm-gray">Payout Schedule</span>
                              <span className="text-pearl">Daily Rolling</span>
                           </div>
                        </div>
                     ) : (
                        <Button variant="primary" onClick={connectStripe}>Connect Bank Account</Button>
                     )}
                  </div>

                  <div className="bg-charcoal/30 border border-pearl/10 p-8">
                     <h4 className="text-warm-gray text-xs uppercase tracking-widest mb-6">Upcoming Payout</h4>
                     <div className="text-5xl font-display text-pearl mb-2">PKR 1.25M</div>
                     <p className="text-tangerine font-mono text-sm mb-8">Scheduled for {format(new Date(Date.now() + 86400000), 'MMM d')}</p>
                     <Button variant="outline" className="w-full">View Transactions</Button>
                  </div>
               </div>
            </div>
         )}

         {/* USERS TAB */}
         {activeTab === 'USERS' && (
            <div className="space-y-4 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-display text-pearl">User Directory</h3>
               </div>

               {/* Filter Chips */}
               <div className="flex flex-wrap gap-2">
                  {(['ALL', 'COLLECTORS', 'ARTISTS', 'PENDING'] as const).map(sub => {
                     const countMap = { ALL: userCounts.all, COLLECTORS: userCounts.collectors, ARTISTS: userCounts.artists, PENDING: userCounts.pending };
                     return (
                        <button
                           key={sub}
                           onClick={() => setUserSubTab(sub)}
                           className={`px-4 py-2 border text-xs uppercase tracking-widest transition-all ${userSubTab === sub
                              ? 'border-tangerine text-tangerine bg-tangerine/10'
                              : 'border-pearl/10 text-warm-gray bg-charcoal/30 hover:bg-tangerine/10 hover:border-tangerine hover:text-tangerine'
                           }`}
                        >
                           {sub} <span className="ml-1 opacity-60">({countMap[sub]})</span>
                        </button>
                     );
                  })}
               </div>

               {/* Search Bar */}
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                  <input
                     type="text"
                     placeholder="Search by name or email..."
                     value={userSearch}
                     onChange={(e) => setUserSearch(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 bg-charcoal/50 border border-pearl/10 text-pearl text-sm placeholder:text-warm-gray/50 focus:border-tangerine/50 focus:outline-none"
                  />
               </div>

               <div className="border border-pearl/10 rounded overflow-hidden">
                  {isLoadingUsers ? (
                     <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-tangerine" />
                        <span className="ml-3 text-warm-gray text-sm">Loading users...</span>
                     </div>
                  ) : (
                  <table className="w-full text-left text-sm">
                     <thead className="bg-charcoal text-warm-gray font-mono text-xs uppercase border-b border-pearl/10">
                        <tr>
                           <th className="p-4">User</th>
                           <th className="p-4 cursor-pointer hover:text-tangerine select-none" onClick={() => toggleSort('role')}>
                              <span className="flex items-center gap-1">Role {userSortField === 'role' && (userSortDir === 'asc' ? '↑' : '↓')}</span>
                           </th>
                           <th className="p-4">Status</th>
                           <th className="p-4 cursor-pointer hover:text-tangerine select-none" onClick={() => toggleSort('createdAt')}>
                              <span className="flex items-center gap-1">Joined {userSortField === 'createdAt' && (userSortDir === 'asc' ? '↑' : '↓')}</span>
                           </th>
                           <th className="p-4">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-pearl/5">
                        {(userSubTab === 'PENDING' ? pendingArtists : sortedUsers).map((u: any) => (
                           <tr key={u.id} className="hover:bg-pearl/5 transition-colors">
                              <td className="p-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-warm-gray/20 rounded-full flex items-center justify-center text-xs font-bold text-pearl">
                                       {u.fullName?.[0] || u.email[0]}
                                    </div>
                                    <div>
                                       <div className="text-pearl font-medium">{u.fullName || 'Guest'}</div>
                                       <div className="text-xs text-warm-gray">{u.email}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-4">
                                 <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${u.role === 'ADMIN' ? 'border-tangerine text-tangerine' : u.role === 'ARTIST' ? 'border-purple-400 text-purple-400' : 'border-warm-gray/50 text-warm-gray'}`}>
                                    {u.role}
                                 </span>
                              </td>
                              <td className="p-4">
                                 {(userSubTab === 'PENDING' || (u.role === 'ARTIST' && !u.isApproved)) ? (
                                    <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">
                                       {!u.isEmailVerified ? 'Unverified' : 'Pending Approval'}
                                    </span>
                                 ) : !u.isEmailVerified ? (
                                    <span className="text-warm-gray text-xs font-bold uppercase tracking-wider">Unverified</span>
                                 ) : (
                                    <span className="text-green-500 text-xs font-bold uppercase tracking-wider">Active</span>
                                 )}
                              </td>
                              <td className="p-4 text-warm-gray font-mono text-xs">
                                 {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '-'}
                              </td>
                              <td className="p-4">
                                 {(userSubTab === 'PENDING' || (u.role === 'ARTIST' && !u.isApproved)) ? (
                                    <div className="flex gap-2">
                                       <button onClick={() => handleApproveArtist(u.id)} disabled={approvingId === u.id} className="p-2 border border-green-500/30 text-green-500 hover:bg-tangerine/10 hover:text-tangerine hover:border-tangerine rounded transition-colors disabled:opacity-50" title="Approve Artist">
                                          {approvingId === u.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                       </button>
                                       <button onClick={() => handleRejectArtist(u.id)} disabled={rejectingId === u.id} className="p-2 border border-red-500/30 text-red-500 hover:bg-tangerine/10 hover:text-tangerine hover:border-tangerine rounded transition-colors disabled:opacity-50" title="Reject Artist">
                                          {rejectingId === u.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                                       </button>
                                    </div>
                                 ) : (
                                    <div className="flex gap-2">
                                       {u.role === 'USER' && (
                                          <button onClick={() => handleUpdateUserRole(u.id, 'ARTIST')} className="p-2 border border-purple-500/30 text-purple-400 hover:bg-tangerine/10 hover:text-tangerine hover:border-tangerine rounded transition-colors" title="Promote to Artist">
                                             <Palette size={16} />
                                          </button>
                                       )}
                                       {u.role === 'ARTIST' && u.isApproved && (
                                          <button onClick={() => handleUpdateUserRole(u.id, 'USER')} className="p-2 border border-warm-gray/30 text-warm-gray hover:bg-tangerine/10 hover:text-tangerine hover:border-tangerine rounded transition-colors" title="Demote to User">
                                             <UserX size={16} />
                                          </button>
                                       )}
                                       <button onClick={() => handleDeleteUser(u.id, u.fullName || u.email)} className="p-2 border border-red-500/30 text-red-500 hover:bg-tangerine/10 hover:text-tangerine hover:border-tangerine rounded transition-colors" title="Delete User">
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 )}
                              </td>
                           </tr>
                        ))}
                        {(userSubTab === 'PENDING' ? pendingArtists : sortedUsers).length === 0 && (
                           <tr><td colSpan={5} className="p-8 text-center text-warm-gray">No users found</td></tr>
                        )}
                     </tbody>
                  </table>
                  )}

                  {/* Pagination */}
                  {userSubTab !== 'PENDING' && usersPagination.totalPages > 1 && !isLoadingUsers && (
                     <div className="flex items-center justify-between px-4 py-3 border-t border-pearl/10">
                        <span className="text-xs text-warm-gray font-mono">
                           Showing {((usersPagination.page - 1) * 20) + 1}–{Math.min(usersPagination.page * 20, usersPagination.total)} of {usersPagination.total}
                        </span>
                        <div className="flex gap-2">
                           <button
                              disabled={usersPagination.page <= 1}
                              onClick={() => loadUsers(usersPagination.page - 1)}
                              className="px-3 py-1 text-xs border border-pearl/20 text-warm-gray hover:text-tangerine hover:border-tangerine transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                              Previous
                           </button>
                           <span className="px-3 py-1 text-xs text-warm-gray font-mono">
                              {usersPagination.page} / {usersPagination.totalPages}
                           </span>
                           <button
                              disabled={usersPagination.page >= usersPagination.totalPages}
                              onClick={() => loadUsers(usersPagination.page + 1)}
                              className="px-3 py-1 text-xs border border-pearl/20 text-warm-gray hover:text-tangerine hover:border-tangerine transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                           >
                              Next
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* REVIEWS TAB */}
         {activeTab === 'REVIEWS' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-display text-pearl">Review Moderation</h3>
               </div>

               {/* Filter Chips */}
               <div className="flex flex-wrap gap-2">
                  {(['pending', 'approved', 'rejected'] as const).map(status => (
                     <button
                        key={status}
                        onClick={() => setReviewFilter(status)}
                        className={`px-4 py-2 border text-xs uppercase tracking-widest transition-all ${reviewFilter === status
                           ? 'border-tangerine text-tangerine bg-tangerine/10'
                           : 'border-pearl/10 text-warm-gray bg-charcoal/30 hover:bg-tangerine/10 hover:border-tangerine hover:text-tangerine'
                        }`}
                     >
                        {status}
                     </button>
                  ))}
               </div>

               {isLoadingReviews ? (
                  <div className="text-center py-12">
                     <Loader2 className="w-8 h-8 text-tangerine animate-spin mx-auto mb-4" />
                     <p className="text-warm-gray">Loading reviews...</p>
                  </div>
               ) : reviews.length === 0 ? (
                  <div className="text-center py-12 border border-pearl/10 rounded bg-charcoal/30">
                     <MessageSquare className="w-12 h-12 text-warm-gray/50 mx-auto mb-4" />
                     <p className="text-warm-gray">No {reviewFilter} reviews found</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {reviews.map((review) => (
                        <div key={review.id} className="border border-pearl/10 rounded bg-charcoal/20 p-6">
                           <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                 <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-warm-gray/20 rounded-full flex items-center justify-center text-sm font-bold text-pearl">
                                       {review.user?.fullName?.[0] || 'U'}
                                    </div>
                                    <div>
                                       <div className="text-pearl font-medium">{review.user?.fullName || 'Anonymous'}</div>
                                       <div className="text-xs text-warm-gray">{review.user?.email}</div>
                                    </div>
                                    {review.isVerifiedPurchase && (
                                       <span className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-medium">
                                          <Check className="w-3 h-3" />
                                          Verified Purchase
                                       </span>
                                    )}
                                 </div>
                                 <div className="mb-3">
                                    <StarRating rating={review.rating} readonly size="sm" />
                                 </div>
                                 {review.comment && (
                                    <p className="text-pearl/80 mb-3">{review.comment}</p>
                                 )}
                                 {review.photos && review.photos.length > 0 && (
                                    <div className="flex gap-2 mb-3">
                                       {review.photos.map((photo: string, idx: number) => (
                                          <img key={idx} src={photo} alt={`Review ${idx + 1}`} className="w-16 h-16 object-cover rounded border border-pearl/10" />
                                       ))}
                                    </div>
                                 )}
                                 <div className="text-xs text-warm-gray font-mono">
                                    Posted: {new Date(review.createdAt).toLocaleString()}
                                 </div>
                              </div>
                              <div className="ml-4">
                                 <div className="text-xs text-warm-gray mb-2">Artwork:</div>
                                 <div className="flex items-center gap-2 mb-4">
                                    {review.artwork?.imageUrl && (
                                       <img src={review.artwork.imageUrl} alt={review.artwork.title} className="w-12 h-12 object-cover rounded" />
                                    )}
                                    <div>
                                       <div className="text-pearl text-sm font-medium">{review.artwork?.title}</div>
                                       <div className="text-xs text-warm-gray">ID: {review.artworkId.slice(-8)}</div>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-pearl/10">
                              <div className="text-xs text-warm-gray">
                                 Helpful: {review.helpfulCount} | Unhelpful: {review.unhelpfulCount}
                              </div>
                              {reviewFilter === 'pending' && (
                                 <div className="flex gap-2">
                                    <button
                                       onClick={async () => {
                                          setReviewActionLoading(review.id);
                                          try {
                                             await reviewApi.approveReview(review.id);
                                             setReviews(prev => prev.filter(r => r.id !== review.id));
                                          } catch (error) {
                                             console.error('Failed to approve review:', error);
                                             alert('Failed to approve review');
                                          } finally {
                                             setReviewActionLoading(null);
                                          }
                                       }}
                                       disabled={reviewActionLoading === review.id}
                                       className="flex items-center gap-2 px-4 py-2 border border-green-500/30 text-green-500 hover:bg-tangerine/10 hover:text-tangerine hover:border-tangerine rounded transition-colors disabled:opacity-50"
                                    >
                                       {reviewActionLoading === review.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                       ) : (
                                          <Check className="w-4 h-4" />
                                       )}
                                       <span className="text-xs uppercase tracking-widest font-bold">Approve</span>
                                    </button>
                                    <button
                                       onClick={async () => {
                                          const reason = prompt('Rejection reason (optional):');
                                          if (reason === null) return; // User cancelled

                                          setReviewActionLoading(review.id);
                                          try {
                                             await reviewApi.rejectReview(review.id, reason || 'Does not meet quality guidelines');
                                             setReviews(prev => prev.filter(r => r.id !== review.id));
                                          } catch (error) {
                                             console.error('Failed to reject review:', error);
                                             alert('Failed to reject review');
                                          } finally {
                                             setReviewActionLoading(null);
                                          }
                                       }}
                                       disabled={reviewActionLoading === review.id}
                                       className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-500 hover:bg-tangerine/10 hover:text-tangerine hover:border-tangerine rounded transition-colors disabled:opacity-50"
                                    >
                                       {reviewActionLoading === review.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                       ) : (
                                          <X className="w-4 h-4" />
                                       )}
                                       <span className="text-xs uppercase tracking-widest font-bold">Reject</span>
                                    </button>
                                 </div>
                              )}
                              {reviewFilter === 'approved' && (
                                 <span className="text-green-500 text-xs flex items-center gap-1">
                                    <Check className="w-4 h-4" />
                                    Approved
                                 </span>
                              )}
                              {reviewFilter === 'rejected' && review.rejectionReason && (
                                 <div className="text-red-500 text-xs">
                                    Rejected: {review.rejectionReason}
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}


         {/* REFERRALS TAB */}
         {activeTab === 'REFERRALS' && (
            <div className="space-y-8 animate-fade-in">
               <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-display text-pearl">Referral Program</h3>
                  <div className="flex items-center gap-3">
                     <span className="text-xs text-warm-gray uppercase tracking-widest">
                        {referralConfig.isEnabled ? 'Active' : 'Inactive'}
                     </span>
                     <button
                        onClick={() => setReferralConfig(c => ({ ...c, isEnabled: !c.isEnabled }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${referralConfig.isEnabled ? 'bg-green-500' : 'bg-warm-gray/30'}`}
                     >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${referralConfig.isEnabled ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>
               </div>

               {isLoadingReferrals ? (
                  <div className="flex items-center justify-center py-16">
                     <Loader2 size={24} className="animate-spin text-tangerine" />
                     <span className="ml-3 text-warm-gray text-sm">Loading referral data...</span>
                  </div>
               ) : (
               <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-charcoal/30 border border-pearl/10 p-6 text-center">
                        <Users size={32} className="text-tangerine mx-auto mb-3" />
                        <div className="text-3xl font-display text-pearl mb-1">{referralStats?.totalReferredUsers || 0}</div>
                        <div className="text-xs text-warm-gray uppercase tracking-widest">Total Referrals</div>
                     </div>
                     <div className="bg-charcoal/30 border border-pearl/10 p-6 text-center">
                        <UserCheck size={32} className="text-tangerine mx-auto mb-3" />
                        <div className="text-3xl font-display text-pearl mb-1">{referralStats?.totalReferrers || 0}</div>
                        <div className="text-xs text-warm-gray uppercase tracking-widest">Active Referrers</div>
                     </div>
                     <div className="bg-charcoal/30 border border-pearl/10 p-6 text-center">
                        <DollarSign size={32} className="text-tangerine mx-auto mb-3" />
                        <div className="text-3xl font-display text-pearl mb-1">{referralConfig.isEnabled ? `${referralConfig.rewardPercentage}%` : 'Off'}</div>
                        <div className="text-xs text-warm-gray uppercase tracking-widest">Reward Rate</div>
                     </div>
                  </div>

                  {/* Configuration Form */}
                  <div className="bg-charcoal/30 border border-pearl/10 p-8 space-y-6">
                     <h4 className="text-warm-gray text-xs uppercase tracking-widest">Program Settings</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest block mb-2">Reward Percentage (%)</label>
                           <input type="number" min="0" max="100" value={referralConfig.rewardPercentage} onChange={(e) => setReferralConfig(c => ({ ...c, rewardPercentage: Number(e.target.value) }))} className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest block mb-2">Fixed Reward Amount (PKR)</label>
                           <input type="number" min="0" value={referralConfig.rewardAmount} onChange={(e) => setReferralConfig(c => ({ ...c, rewardAmount: Number(e.target.value) }))} className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest block mb-2">Max Rewards Per User</label>
                           <input type="number" min="1" value={referralConfig.maxRewardsPerUser} onChange={(e) => setReferralConfig(c => ({ ...c, maxRewardsPerUser: Number(e.target.value) }))} className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" />
                        </div>
                     </div>
                     <Button variant="primary" onClick={handleSaveReferralConfig} disabled={isSavingReferralConfig}>
                        {isSavingReferralConfig ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : 'Save Configuration'}
                     </Button>
                  </div>

                  {/* Top Referrers Table */}
                  <div className="border border-pearl/10 rounded overflow-hidden">
                     <div className="bg-charcoal/30 px-6 py-4 border-b border-pearl/10">
                        <h4 className="text-warm-gray text-xs uppercase tracking-widest">Top Referrers</h4>
                     </div>
                     <table className="w-full text-left text-sm">
                        <thead className="bg-charcoal text-warm-gray font-mono text-xs uppercase border-b border-pearl/10">
                           <tr>
                              <th className="p-4">User</th>
                              <th className="p-4">Referral Code</th>
                              <th className="p-4">Referrals</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-pearl/5">
                           {referralStats?.topReferrers.map((r: any) => (
                              <tr key={r.id} className="hover:bg-pearl/5 transition-colors">
                                 <td className="p-4">
                                    <div className="text-pearl font-medium">{r.fullName}</div>
                                    <div className="text-xs text-warm-gray">{r.email}</div>
                                 </td>
                                 <td className="p-4 font-mono text-tangerine text-xs">{r.referralCode}</td>
                                 <td className="p-4 text-pearl font-display text-lg">{r.referralCount}</td>
                              </tr>
                           ))}
                           {(!referralStats?.topReferrers || referralStats.topReferrers.length === 0) && (
                              <tr><td colSpan={3} className="p-8 text-center text-warm-gray">No referrals yet</td></tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </>
               )}
            </div>
         )}

         {/* LANDING PAGE TAB */}
         {activeTab === 'LANDING PAGE' && (
            <div className="space-y-8 animate-fade-in pb-24">
               <div className="flex justify-between items-center sticky top-20 bg-void/90 backdrop-blur z-40 py-4 border-b border-pearl/10">
                  <h2 className="text-2xl font-display text-pearl">Landing Page Builder</h2>
                  <Button variant="primary" onClick={handleSaveLandingPage}>
                     <Save size={18} className="mr-2" /> Publish Changes
                  </Button>
               </div>

               {/* Section Visibility */}
               <div className="bg-charcoal/30 p-6 border border-pearl/10">
                  <h3 className="text-pearl font-display text-lg mb-4">Section Visibility</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {Object.keys(landingForm).map(key => (
                        <label key={key} className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${landingForm[key].enabled ? 'border-tangerine bg-tangerine/10' : 'border-pearl/10 hover:border-tangerine'}`}>
                           <input
                              type="checkbox"
                              checked={landingForm[key].enabled}
                              onChange={(e) => setLandingForm({ ...landingForm, [key]: { ...landingForm[key], enabled: e.target.checked } })}
                              className="accent-tangerine w-4 h-4"
                           />
                           <span className="text-xs uppercase tracking-widest text-pearl">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                     ))}
                  </div>
               </div>

               {/* Hero Editor */}
               <div className="bg-charcoal/30 p-6 border border-pearl/10">
                  <h3 className="text-pearl font-display text-lg mb-4">Hero Section</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Main Title</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl font-display text-lg" value={landingForm.hero.title} onChange={e => setLandingForm({ ...landingForm, hero: { ...landingForm.hero, title: e.target.value } })} />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Subtitle</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl" value={landingForm.hero.subtitle} onChange={e => setLandingForm({ ...landingForm, hero: { ...landingForm.hero, subtitle: e.target.value } })} />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Accent Word (Italicized)</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-tangerine font-display italic" value={landingForm.hero.accentWord} onChange={e => setLandingForm({ ...landingForm, hero: { ...landingForm.hero, accentWord: e.target.value } })} />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Hero Slideshow (Max 10)</label>
                        <div className="grid grid-cols-4 gap-2">
                           {(landingForm.hero.backgroundImages || []).map((img, idx) => (
                              <div key={idx} className="relative aspect-video group">
                                 <img src={img} className="w-full h-full object-cover border border-pearl/20" />
                                 <button onClick={() => removeBackgroundImage(idx)} className="absolute inset-0 bg-red-900/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 size={16} /></button>
                              </div>
                           ))}
                           <label className="aspect-video border-2 border-dashed border-pearl/20 hover:border-tangerine flex items-center justify-center cursor-pointer transition-colors">
                              <input type="file" className="hidden" onChange={handleBackgroundImagesUpload} />
                              <Plus className="text-warm-gray" />
                           </label>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Featured Exhibition */}
               <div className="bg-charcoal/30 p-6 border border-pearl/10">
                  <h3 className="text-pearl font-display text-lg mb-4">Featured Exhibition</h3>
                  <div className="flex gap-4 mb-4">
                     <button onClick={() => setExhibitionMode('auto')} className={`px-4 py-2 text-xs uppercase font-bold border ${exhibitionMode === 'auto' ? 'border-tangerine text-tangerine' : 'border-pearl/20 text-warm-gray'}`}>Auto-Select</button>
                     <button onClick={() => setExhibitionMode('manual')} className={`px-4 py-2 text-xs uppercase font-bold border ${exhibitionMode === 'manual' ? 'border-tangerine text-tangerine' : 'border-pearl/20 text-warm-gray'}`}>Manual Customization</button>
                  </div>

                  {exhibitionMode === 'auto' ? (
                     <select
                        className="w-full bg-void border border-pearl/20 p-3 text-pearl"
                        onChange={e => setLandingForm({ ...landingForm, featuredExhibition: { ...landingForm.featuredExhibition, exhibitionId: e.target.value } })}
                        value={landingForm.featuredExhibition.exhibitionId || ''}
                     >
                        <option value="">Select an Active Exhibition</option>
                        {exhibitions.map(ex => <option key={ex.id} value={ex.id}>{ex.title} ({ex.status})</option>)}
                     </select>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="bg-void border border-pearl/20 p-3 text-pearl" placeholder="Exhibition Title" value={landingForm.featuredExhibition.manualOverride.title} onChange={e => setLandingForm({ ...landingForm, featuredExhibition: { ...landingForm.featuredExhibition, manualOverride: { ...landingForm.featuredExhibition.manualOverride, title: e.target.value } as any } })} />
                        <input className="bg-void border border-pearl/20 p-3 text-pearl" placeholder="Artist Name" value={landingForm.featuredExhibition.manualOverride.artistName} onChange={e => setLandingForm({ ...landingForm, featuredExhibition: { ...landingForm.featuredExhibition, manualOverride: { ...landingForm.featuredExhibition.manualOverride, artistName: e.target.value } as any } })} />
                        <input className="bg-void border border-pearl/20 p-3 text-pearl" placeholder="Date Range" value={landingForm.featuredExhibition.manualOverride.date} onChange={e => setLandingForm({ ...landingForm, featuredExhibition: { ...landingForm.featuredExhibition, manualOverride: { ...landingForm.featuredExhibition.manualOverride, date: e.target.value } as any } })} />
                        <input className="bg-void border border-pearl/20 p-3 text-pearl" placeholder="Image URL" value={landingForm.featuredExhibition.manualOverride.imageUrl} onChange={e => setLandingForm({ ...landingForm, featuredExhibition: { ...landingForm.featuredExhibition, manualOverride: { ...landingForm.featuredExhibition.manualOverride, imageUrl: e.target.value } as any } })} />
                        <textarea className="col-span-2 bg-void border border-pearl/20 p-3 text-pearl" placeholder="Description" rows={3} value={landingForm.featuredExhibition.manualOverride.description} onChange={e => setLandingForm({ ...landingForm, featuredExhibition: { ...landingForm.featuredExhibition, manualOverride: { ...landingForm.featuredExhibition.manualOverride, description: e.target.value } as any } })} />
                     </div>
                  )}
               </div>

               {/* Top 5 Highlight Config */}
               <div className="bg-charcoal/30 p-6 border border-pearl/10">
                  <h3 className="text-pearl font-display text-lg mb-4">Top 5 Highlights</h3>
                  <div className="space-y-4">
                     <p className="text-xs text-warm-gray mb-2">Select artworks to feature in the "Top 5" section. (Max 5)</p>
                     <div className="flex flex-wrap gap-2 mb-2">
                        {landingForm.topPaintings.artworkIds.map(id => {
                           const art = artworks.find(a => a.id === id);
                           return (
                              <span key={id} className="text-xs border border-pearl/10 px-2 py-1 flex items-center gap-2 bg-charcoal text-pearl">
                                 {art?.title || id}
                                 <button onClick={() => {
                                    const newIds = landingForm.topPaintings.artworkIds.filter(aid => aid !== id);
                                    setLandingForm({ ...landingForm, topPaintings: { ...landingForm.topPaintings, artworkIds: newIds } });
                                 }} className="hover:text-tangerine"><X size={12} /></button>
                              </span>
                           )
                        })}
                     </div>

                     {landingForm.topPaintings.artworkIds.length < 5 && (
                        <select
                           className="w-full bg-charcoal border border-pearl/10 text-xs p-2 text-pearl focus:border-tangerine outline-none"
                           onChange={e => {
                              if (e.target.value && !landingForm.topPaintings.artworkIds.includes(e.target.value)) {
                                 setLandingForm({
                                    ...landingForm,
                                    topPaintings: {
                                       ...landingForm.topPaintings,
                                       artworkIds: [...landingForm.topPaintings.artworkIds, e.target.value]
                                    }
                                 });
                              }
                              e.target.value = '';
                           }}
                        >
                           <option value="">+ Add Artwork to Top 5</option>
                           {artworks.map(a => <option key={a.id} value={a.id}>{a.title} - {a.artistName}</option>)}
                        </select>
                     )}
                  </div>
               </div>

               {/* Collections Builders */}
               <div className="bg-charcoal/30 p-6 border border-pearl/10">
                  <h3 className="text-pearl font-display text-lg mb-4">Curated Collections</h3>
                  <div className="space-y-4">
                     {landingForm.curatedCollections.collections.map((col, idx) => (
                        <div key={idx} className="border border-pearl/10 bg-void p-4 space-y-3">
                           <div className="flex justify-between mb-2">
                              <input className="bg-transparent text-tangerine font-display text-lg outline-none w-full" value={col.title} onChange={e => {
                                 const newCols = [...landingForm.curatedCollections.collections];
                                 newCols[idx].title = e.target.value;
                                 setLandingForm({ ...landingForm, curatedCollections: { ...landingForm.curatedCollections, collections: newCols } });
                              }} placeholder="Collection Title" />
                              <button onClick={() => {
                                 const newCols = landingForm.curatedCollections.collections.filter((_, i) => i !== idx);
                                 setLandingForm({ ...landingForm, curatedCollections: { ...landingForm.curatedCollections, collections: newCols } });
                              }} className="text-red-500"><Trash2 size={16} /></button>
                           </div>

                           <textarea
                              className="w-full bg-charcoal border border-pearl/10 text-xs p-2 text-pearl font-mono resize-none"
                              rows={2}
                              value={col.description || ''}
                              onChange={e => {
                                 const newCols = [...landingForm.curatedCollections.collections];
                                 newCols[idx].description = e.target.value;
                                 setLandingForm({ ...landingForm, curatedCollections: { ...landingForm.curatedCollections, collections: newCols } });
                              }}
                              placeholder="Collection description..."
                           />

                           <input
                              className="w-full bg-charcoal border border-pearl/10 text-xs p-2 text-pearl font-mono"
                              value={col.imageUrl || ''}
                              onChange={e => {
                                 const newCols = [...landingForm.curatedCollections.collections];
                                 newCols[idx].imageUrl = e.target.value;
                                 setLandingForm({ ...landingForm, curatedCollections: { ...landingForm.curatedCollections, collections: newCols } });
                              }}
                              placeholder="Cover image URL (optional - will use first artwork if empty)"
                           />

                           <div className="flex flex-wrap gap-2">
                              {col.artworkIds.map(id => {
                                 const art = artworks.find(a => a.id === id);
                                 return (
                                    <span key={id} className="text-xs border border-pearl/10 px-2 py-1 flex items-center gap-2 bg-charcoal">
                                       {art?.title || id}
                                       <button onClick={() => {
                                          const newCols = [...landingForm.curatedCollections.collections];
                                          newCols[idx].artworkIds = newCols[idx].artworkIds.filter(aid => aid !== id);
                                          setLandingForm({ ...landingForm, curatedCollections: { ...landingForm.curatedCollections, collections: newCols } });
                                       }} className="hover:text-tangerine"><X size={12} /></button>
                                    </span>
                                 )
                              })}
                           </div>

                           <select
                              className="w-full bg-charcoal border border-pearl/10 text-xs p-2 text-pearl"
                              onChange={e => {
                                 if (e.target.value) {
                                    const newCols = [...landingForm.curatedCollections.collections];
                                    if (!newCols[idx].artworkIds.includes(e.target.value)) {
                                       newCols[idx].artworkIds.push(e.target.value);
                                       setLandingForm({ ...landingForm, curatedCollections: { ...landingForm.curatedCollections, collections: newCols } });
                                    }
                                    e.target.value = '';
                                 }
                              }}
                           >
                              <option value="">+ Add Artwork to Collection</option>
                              {artworks.map(a => <option key={a.id} value={a.id}>{a.title} - {a.artistName}</option>)}
                           </select>
                        </div>
                     ))}
                     {landingForm.curatedCollections.collections.length < 3 && (
                        <Button variant="outline" className="w-full py-3" onClick={() => setLandingForm({
                           ...landingForm,
                           curatedCollections: {
                              ...landingForm.curatedCollections,
                              collections: [...landingForm.curatedCollections.collections, { id: Date.now().toString(), title: 'New Collection', description: '', artworkIds: [], imageUrl: '', layout: 'normal' }]
                           }
                        })}>+ Add New Collection Section</Button>
                     )}
                  </div>
               </div>

               {/* Global Content (Social Links) */}
               <div className="bg-charcoal/30 p-6 border border-pearl/10">
                  <h3 className="text-pearl font-display text-lg mb-4 flex items-center gap-2"><Globe size={18} /> Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Facebook URL</label>
                        <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" value={heroForm.socialLinks?.facebook || ''} onChange={e => setHeroForm({ ...heroForm, socialLinks: { ...heroForm.socialLinks, facebook: e.target.value } })} />
                     </div>
                     <div>
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Instagram URL</label>
                        <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" value={heroForm.socialLinks?.instagram || ''} onChange={e => setHeroForm({ ...heroForm, socialLinks: { ...heroForm.socialLinks, instagram: e.target.value } })} />
                     </div>
                  </div>
                  <div className="flex justify-end mt-4">
                     <Button variant="outline" onClick={handleSaveContent}>
                        <Save size={14} className="mr-2" /> Save Social Links
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* MODALS - Styled Globally */}
         {/* Add Artwork Modal */}
         {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] bg-void/90 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-charcoal border border-pearl/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative">
                  <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-warm-gray hover:text-tangerine"><X size={24} /></button>
                  <h3 className="text-2xl font-display text-pearl mb-6 border-b border-pearl/10 pb-4">{editingArtworkId ? 'Edit Masterpiece' : 'New Masterpiece'}</h3>

                  <div className="space-y-4">
                     {/* Row 1: Title & Artist */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Title</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" placeholder="Artwork Title" value={newArtwork.title} onChange={e => setNewArtwork({ ...newArtwork, title: e.target.value })} />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Artist</label>
                           <select
                              className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none"
                              value={newArtwork.artistId}
                              onChange={e => {
                                 const selectedArtist = artists.find(a => a.id === e.target.value);
                                 setNewArtwork({ ...newArtwork, artistId: e.target.value, artistName: selectedArtist?.name || '' });
                              }}
                           >
                              <option value="">Select Artist</option>
                              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                           </select>
                        </div>
                     </div>

                     {/* Row 2: Price, Year, Category */}
                     <div className="grid grid-cols-3 gap-4">
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Price (PKR)</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" type="number" value={newArtwork.price || ''} onChange={e => setNewArtwork({ ...newArtwork, price: Number(e.target.value) })} />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Year</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" type="number" value={newArtwork.year} onChange={e => setNewArtwork({ ...newArtwork, year: Number(e.target.value) })} />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Category</label>
                           <select className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" value={newArtwork.category} onChange={e => setNewArtwork({ ...newArtwork, category: e.target.value })}>
                              {['Calligraphy', 'Landscape', 'Abstract', 'Miniature', 'Portrait', 'Contemporary'].map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                     </div>

                     {/* Row 3: Medium & Dimensions */}
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Medium</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" placeholder="e.g. Oil on Canvas" value={newArtwork.medium} onChange={e => setNewArtwork({ ...newArtwork, medium: e.target.value })} />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Dimensions</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" placeholder="e.g. 24 x 36 inches" value={newArtwork.dimensions} onChange={e => setNewArtwork({ ...newArtwork, dimensions: e.target.value })} />
                        </div>
                     </div>

                     {/* Description */}
                     <div>
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Description</label>
                        <textarea className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" rows={4} value={newArtwork.description} onChange={e => setNewArtwork({ ...newArtwork, description: e.target.value })} />
                     </div>

                     {/* Image Upload Area */}
                     <div className="border-2 border-dashed border-pearl/20 p-8 text-center hover:border-tangerine/50 transition-colors cursor-pointer relative group">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                        {newArtwork.imageUrl ? (
                           <img src={newArtwork.imageUrl} className="max-h-48 mx-auto" />
                        ) : (
                           <div className="text-warm-gray">
                              <ImageIcon className="mx-auto mb-2" />
                              <p className="text-xs uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Upload Artwork Image'}</p>
                           </div>
                        )}
                     </div>

                     {/* In Stock Toggle */}
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newArtwork.inStock} onChange={e => setNewArtwork({ ...newArtwork, inStock: e.target.checked })} className="accent-tangerine w-4 h-4" />
                        <span className="text-pearl text-sm">Available in Stock</span>
                     </label>

                     <div className="flex gap-4 pt-4">
                        <Button variant="primary" onClick={handleSaveArtwork} className="flex-1">{editingArtworkId ? 'Update Masterpiece' : 'Add to Collection'}</Button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Exhibition Modal */}
         {isExhModalOpen && (
            <div className="fixed inset-0 z-[100] bg-void/90 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-charcoal border border-pearl/20 w-full max-w-5xl p-8 relative max-h-[90vh] overflow-y-auto">
                  <button onClick={() => setIsExhModalOpen(false)} className="absolute top-4 right-4 text-warm-gray hover:text-tangerine z-10"><X size={24} /></button>
                  <h3 className="text-2xl font-display text-pearl mb-6">{editingExhId ? 'Edit Exhibition' : 'Curate Exhibition'}</h3>
                  <div className="space-y-4">
                     {/* Title & Location */}
                     <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Title</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" placeholder="Exhibition Title" value={newExh.title} onChange={e => setNewExh({ ...newExh, title: e.target.value })} />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Location</label>
                           <select
                              className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none"
                              value={newExh.location}
                              onChange={e => {
                                 const val = e.target.value;
                                 setNewExh(prev => ({
                                    ...prev,
                                    location: val,
                                    isVirtual: val === 'Virtual Exhibition',
                                 }));
                              }}
                           >
                              <option value="" disabled>Select Location...</option>
                              <option value="Muraqqa Main Gallery">Muraqqa Main Gallery</option>
                              <option value="Muraqqa North Wing">Muraqqa North Wing</option>
                              <option value="Virtual Exhibition">Virtual Exhibition</option>
                              <option value="External Venue">External Venue</option>
                           </select>
                        </div>
                     </div>

                     {/* Conditional: Virtual URL or External Venue Name */}
                     {newExh.location === 'Virtual Exhibition' && (
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Virtual Exhibition URL</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" placeholder="https://..." value={newExh.virtualUrl || ''} onChange={e => setNewExh({ ...newExh, virtualUrl: e.target.value })} />
                        </div>
                     )}
                     {newExh.location === 'External Venue' && (
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Venue Name & Address</label>
                           <input className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" placeholder="Venue name and address" value={newExh.venueName || ''} onChange={e => setNewExh({ ...newExh, venueName: e.target.value })} />
                        </div>
                     )}

                     {/* Dates, Status & Virtual */}
                     <div className="grid grid-cols-4 gap-4">
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Start Date</label>
                           <input type="date" className="w-full bg-void border border-pearl/20 p-3 text-pearl" value={newExh.startDate} onChange={e => setNewExh({ ...newExh, startDate: e.target.value })} />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">End Date</label>
                           <input type="date" className="w-full bg-void border border-pearl/20 p-3 text-pearl" value={newExh.endDate} onChange={e => setNewExh({ ...newExh, endDate: e.target.value })} />
                        </div>
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Status</label>
                           <select className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" value={newExh.status} onChange={e => setNewExh({ ...newExh, status: e.target.value })}>
                              <option value="UPCOMING">Upcoming</option>
                              <option value="CURRENT">Current</option>
                              <option value="PAST">Past Reflection</option>
                           </select>
                        </div>
                        <div className="flex items-end pb-1">
                           <label className="flex items-center gap-2 text-sm text-pearl cursor-pointer p-3">
                              <input type="checkbox" checked={newExh.isVirtual} onChange={e => setNewExh({ ...newExh, isVirtual: e.target.checked })} className="accent-tangerine" />
                              Virtual
                           </label>
                        </div>
                     </div>

                     {/* Description */}
                     <div>
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Curatorial Statement</label>
                        <textarea className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none" rows={3} placeholder="Description" value={newExh.description} onChange={e => setNewExh({ ...newExh, description: e.target.value })} />
                     </div>

                     {/* Cover Image & Video URL side by side */}
                     <div className="grid grid-cols-2 gap-6">
                        {/* Cover Image */}
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Cover Image</label>
                           <div className="flex gap-4 items-center">
                              {newExh.imageUrl ? (
                                 <div className="relative w-32 h-20 group">
                                    <img src={newExh.imageUrl} alt="Cover" className="w-full h-full object-cover border border-pearl/20" />
                                    <button onClick={() => setNewExh({ ...newExh, imageUrl: '' })} className="absolute top-1 right-1 bg-red-500/80 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                 </div>
                              ) : isUploadingExhImage ? (
                                 <div className="w-32 h-20 border border-dashed border-tangerine/50 flex flex-col items-center justify-center bg-void/50">
                                    <Loader2 size={20} className="animate-spin text-tangerine mb-1" />
                                    <span className="text-[10px] uppercase text-tangerine">Uploading...</span>
                                 </div>
                              ) : (
                                 <label className="w-32 h-20 border border-dashed border-pearl/20 flex flex-col items-center justify-center text-warm-gray hover:text-tangerine hover:border-tangerine cursor-pointer">
                                    <Upload size={20} className="mb-1" />
                                    <span className="text-[10px] uppercase">Upload</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                       const file = e.target.files?.[0];
                                       if (file) {
                                          try {
                                             setIsUploadingExhImage(true);
                                             const url = await uploadApi.uploadImage(file);
                                             setNewExh(prev => ({ ...prev, imageUrl: url }));
                                          } catch (err: any) {
                                             alert(err.message || 'Upload failed');
                                          } finally {
                                             setIsUploadingExhImage(false);
                                          }
                                       }
                                    }} />
                                 </label>
                              )}
                           </div>
                        </div>

                        {/* Youtube Video URL */}
                        <div>
                           <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">YouTube Video URL</label>
                           <input
                              className="w-full bg-void border border-pearl/20 p-3 text-pearl focus:border-tangerine outline-none"
                              placeholder="https://www.youtube.com/watch?v=..."
                              value={newExh.videoUrl || ''}
                              onChange={e => setNewExh({ ...newExh, videoUrl: e.target.value })}
                           />
                           {newExh.videoUrl && (
                              <p className="text-[10px] text-warm-gray mt-1 flex items-center gap-1">
                                 <span className="text-tangerine">●</span> Video will appear in the exhibition details
                              </p>
                           )}
                        </div>
                     </div>

                     {/* Gallery Images (Multi-select) - Scrollable Container */}
                     <div>
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">
                           Exhibition Gallery {(newExh.galleryImages || []).length > 0 && <span className="text-tangerine ml-1">({(newExh.galleryImages || []).length} photos)</span>}
                        </label>
                        <div className="max-h-44 overflow-y-auto border border-pearl/10 bg-void/30 p-2 rounded" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6b7280 transparent' }}>
                           <div className="flex flex-wrap gap-2">
                              {(newExh.galleryImages || []).map((url, idx) => (
                                 <div key={idx} className="relative w-20 h-20 flex-shrink-0 group">
                                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover border border-pearl/20" />
                                    <button onClick={() => setNewExh({ ...newExh, galleryImages: newExh.galleryImages!.filter((_, i) => i !== idx) })} className="absolute top-0.5 right-0.5 bg-red-500/80 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                 </div>
                              ))}
                              {isUploadingExhGallery ? (
                                 <div className="w-20 h-20 flex-shrink-0 border border-dashed border-tangerine/50 flex flex-col items-center justify-center bg-void/50">
                                    <Loader2 size={16} className="animate-spin text-tangerine mb-1" />
                                    <span className="text-[8px] uppercase text-tangerine">Uploading...</span>
                                 </div>
                              ) : (
                                 <label className="w-20 h-20 flex-shrink-0 border border-dashed border-pearl/20 flex flex-col items-center justify-center text-warm-gray hover:text-tangerine hover:border-tangerine cursor-pointer bg-void/50">
                                    <Upload size={16} className="mb-1" />
                                    <span className="text-[8px] uppercase text-center px-1">Add Photos</span>
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={async (e) => {
                                       const files = Array.from(e.target.files || []);
                                       if (files.length > 0) {
                                          try {
                                             setIsUploadingExhGallery(true);
                                             const promises = files.map(file => uploadApi.uploadImage(file));
                                             const urls = await Promise.all(promises);
                                             setNewExh(prev => ({ ...prev, galleryImages: [...(prev.galleryImages || []), ...urls] }));
                                          } catch (err: any) {
                                             alert(err.message || 'One or more uploads failed');
                                          } finally {
                                             setIsUploadingExhGallery(false);
                                          }
                                       }
                                    }} />
                                 </label>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="flex justify-end pt-4 border-t border-pearl/10">
                        <Button variant="primary" onClick={handleAddExhibition} className="w-full max-w-[220px]">
                           {editingExhId ? 'Update' : 'Launch'} Exhibition
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* THEME TAB */}
         {activeTab === 'THEME' && (
            <div className="space-y-8 animate-fade-in pb-24">
               <div className="flex justify-between items-center sticky top-20 bg-void/90 backdrop-blur z-40 py-4 border-b border-pearl/10">
                  <div>
                     <h2 className="text-2xl font-display text-pearl">Theme Builder</h2>
                     <p className="text-xs text-warm-gray">Customize the visual identity of MuraqQa</p>
                  </div>
                  <div className="flex gap-4">
                     <Button variant="secondary" onClick={() => {
                        resetTheme();
                        alert('Theme reset to default!');
                     }}>Reset Default</Button>
                     <Button variant="primary" onClick={() => {
                        applyTheme(themeBuilder);
                        alert('Theme saved successfully!');
                     }}>
                        <Save size={18} className="mr-2" /> Apply Theory
                     </Button>
                  </div>
               </div>

               {/* Preset Scenes */}
               <div className="bg-charcoal/30 p-6 border border-pearl/10">
                  <h3 className="text-pearl font-display text-lg mb-4 flex items-center gap-2">
                     <Palette size={20} className="text-tangerine" /> Prebuilt Atmospheres
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {Object.entries(PRESET_THEMES).map(([key, theme]) => (
                        <button
                           key={key}
                           onClick={() => {
                              applyTheme(theme);
                              setThemeBuilder(theme);
                           }}
                           className={cn(
                              "p-4 border text-left transition-all hover:scale-[1.02]",
                              currentTheme.name === theme.name
                                 ? "border-tangerine bg-tangerine/10 shadow-[0_0_20px_rgba(255,107,53,0.15)]"
                                 : "border-pearl/10 hover:border-tangerine bg-void"
                           )}
                        >
                           <div className="flex gap-2 mb-3">
                              <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: theme.colors.void }} />
                              <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: theme.colors.tangerine }} />
                              <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: theme.colors.pearl }} />
                           </div>
                           <h4 className="text-sm font-bold text-pearl mb-1">{theme.name}</h4>
                           <p className="text-[10px] text-warm-gray uppercase tracking-widest">Preset</p>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Custom Color Lab */}
               <div className="bg-charcoal/30 p-6 border border-pearl/10">
                  <h3 className="text-pearl font-display text-lg mb-4 flex items-center gap-2">
                     <Palette size={20} className="text-tangerine" /> Chromatic Lab
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Primary Accent (Tangerine)</label>
                        <div className="flex gap-4 items-center">
                           <input
                              type="color"
                              value={themeBuilder.colors.tangerine}
                              onChange={(e) => {
                                 const newTheme = { ...themeBuilder, colors: { ...themeBuilder.colors, tangerine: e.target.value } };
                                 setThemeBuilder(newTheme);
                                 applyTheme(newTheme); // Live preview
                              }}
                              className="w-12 h-12 border-none bg-transparent cursor-pointer"
                           />
                           <input
                              type="text"
                              value={themeBuilder.colors.tangerine}
                              className="bg-void border border-pearl/20 p-2 text-pearl font-mono w-full"
                              readOnly
                           />
                        </div>

                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block mt-4">Secondary Accent (Amber)</label>
                        <div className="flex gap-4 items-center">
                           <input
                              type="color"
                              value={themeBuilder.colors.amber}
                              onChange={(e) => {
                                 const newTheme = { ...themeBuilder, colors: { ...themeBuilder.colors, amber: e.target.value } };
                                 setThemeBuilder(newTheme);
                                 applyTheme(newTheme);
                              }}
                              className="w-12 h-12 border-none bg-transparent cursor-pointer"
                           />
                           <input
                              type="text"
                              value={themeBuilder.colors.amber}
                              className="bg-void border border-pearl/20 p-2 text-pearl font-mono w-full"
                              readOnly
                           />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block">Background Depth (Void)</label>
                        <div className="flex gap-4 items-center">
                           <input
                              type="color"
                              value={themeBuilder.colors.void}
                              onChange={(e) => {
                                 const newTheme = { ...themeBuilder, colors: { ...themeBuilder.colors, void: e.target.value } };
                                 setThemeBuilder(newTheme);
                                 applyTheme(newTheme);
                              }}
                              className="w-12 h-12 border-none bg-transparent cursor-pointer"
                           />
                           <input
                              type="text"
                              value={themeBuilder.colors.void}
                              className="bg-void border border-pearl/20 p-2 text-pearl font-mono w-full"
                              readOnly
                           />
                        </div>

                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block mt-4">Surface Texture (Charcoal)</label>
                        <div className="flex gap-4 items-center">
                           <input
                              type="color"
                              value={themeBuilder.colors.charcoal}
                              onChange={(e) => {
                                 const newTheme = { ...themeBuilder, colors: { ...themeBuilder.colors, charcoal: e.target.value } };
                                 setThemeBuilder(newTheme);
                                 applyTheme(newTheme);
                              }}
                              className="w-12 h-12 border-none bg-transparent cursor-pointer"
                           />
                           <input
                              type="text"
                              value={themeBuilder.colors.charcoal}
                              className="bg-void border border-pearl/20 p-2 text-pearl font-mono w-full"
                              readOnly
                           />
                        </div>

                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-1 block mt-6">Border Color (Separators & Lines)</label>
                        <div className="space-y-3">
                           {/* Color Picker with Opacity Slider */}
                           <div className="flex gap-4 items-start">
                              <div className="space-y-2 flex-1">
                                 <div className="flex gap-4 items-center">
                                    <input
                                       type="color"
                                       value={(() => {
                                          // Extract RGB from rgba string
                                          const match = themeBuilder.colors.border.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                          if (match) {
                                             const r = parseInt(match[1]).toString(16).padStart(2, '0');
                                             const g = parseInt(match[2]).toString(16).padStart(2, '0');
                                             const b = parseInt(match[3]).toString(16).padStart(2, '0');
                                             return `#${r}${g}${b}`;
                                          }
                                          return '#f5f5f5';
                                       })()}
                                       onChange={(e) => {
                                          // Convert hex to rgb and combine with existing alpha
                                          const hex = e.target.value;
                                          const r = parseInt(hex.slice(1, 3), 16);
                                          const g = parseInt(hex.slice(3, 5), 16);
                                          const b = parseInt(hex.slice(5, 7), 16);
                                          const alphaMatch = themeBuilder.colors.border.match(/,\s*([\d.]+)\)/);
                                          const alpha = alphaMatch ? alphaMatch[1] : '0.1';
                                          const newBorder = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                                          const newTheme = { ...themeBuilder, colors: { ...themeBuilder.colors, border: newBorder } };
                                          setThemeBuilder(newTheme);
                                          applyTheme(newTheme);
                                       }}
                                       className="w-12 h-12 border-none bg-transparent cursor-pointer"
                                    />
                                    <div className="flex-1">
                                       <label className="text-[10px] text-warm-gray uppercase tracking-widest mb-2 block">Opacity</label>
                                       <input
                                          type="range"
                                          min="0"
                                          max="1"
                                          step="0.05"
                                          value={(() => {
                                             const alphaMatch = themeBuilder.colors.border.match(/,\s*([\d.]+)\)/);
                                             return alphaMatch ? alphaMatch[1] : '0.1';
                                          })()}
                                          onChange={(e) => {
                                             // Update only the alpha value
                                             const match = themeBuilder.colors.border.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                             if (match) {
                                                const r = match[1];
                                                const g = match[2];
                                                const b = match[3];
                                                const newBorder = `rgba(${r}, ${g}, ${b}, ${e.target.value})`;
                                                const newTheme = { ...themeBuilder, colors: { ...themeBuilder.colors, border: newBorder } };
                                                setThemeBuilder(newTheme);
                                                applyTheme(newTheme);
                                             }
                                          }}
                                          className="w-full accent-tangerine"
                                       />
                                       <div className="flex justify-between text-[10px] text-warm-gray/60 mt-1">
                                          <span>0%</span>
                                          <span className="text-tangerine font-mono">{Math.round(parseFloat((() => {
                                             const alphaMatch = themeBuilder.colors.border.match(/,\s*([\d.]+)\)/);
                                             return alphaMatch ? alphaMatch[1] : '0.1';
                                          })()) * 100)}%</span>
                                          <span>100%</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Preview & Value Display */}
                           <div className="bg-charcoal border border-pearl/20 p-3 rounded">
                              <div className="flex items-center gap-3 mb-2">
                                 <div className="w-16 h-8 border-2" style={{ borderColor: themeBuilder.colors.border, backgroundColor: themeBuilder.colors.void }}></div>
                                 <span className="text-[10px] text-warm-gray uppercase tracking-widest">Preview</span>
                              </div>
                              <input
                                 type="text"
                                 value={themeBuilder.colors.border}
                                 className="w-full bg-void border border-pearl/20 p-2 text-pearl font-mono text-xs"
                                 readOnly
                              />
                           </div>

                           {/* Quick Presets */}
                           <div className="flex gap-2 flex-wrap">
                              <button
                                 onClick={() => {
                                    const newTheme = { ...themeBuilder, colors: { ...themeBuilder.colors, border: 'rgba(245, 245, 245, 0.1)' } };
                                    setThemeBuilder(newTheme);
                                    applyTheme(newTheme);
                                 }}
                                 className="px-3 py-1 bg-charcoal border border-pearl/20 text-pearl text-xs hover:border-tangerine transition-colors"
                              >
                                 Light (10%)
                              </button>
                              <button
                                 onClick={() => {
                                    const newTheme = { ...themeBuilder, colors: { ...themeBuilder.colors, border: 'rgba(245, 245, 245, 0.2)' } };
                                    setThemeBuilder(newTheme);
                                    applyTheme(newTheme);
                                 }}
                                 className="px-3 py-1 bg-charcoal border border-pearl/20 text-pearl text-xs hover:border-tangerine transition-colors"
                              >
                                 Medium (20%)
                              </button>
                              <button
                                 onClick={() => {
                                    const newTheme = { ...themeBuilder, colors: { ...themeBuilder.colors, border: 'rgba(245, 245, 245, 0.3)' } };
                                    setThemeBuilder(newTheme);
                                    applyTheme(newTheme);
                                 }}
                                 className="px-3 py-1 bg-charcoal border border-pearl/20 text-pearl text-xs hover:border-tangerine transition-colors"
                              >
                                 Bold (30%)
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Typography Config */}
               <div className="bg-charcoal/30 p-6 border border-pearl/10">
                  <h3 className="text-pearl font-display text-lg mb-4 flex items-center gap-2">
                     <Type size={20} className="text-tangerine" /> Typography System
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div>
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-4 block">Display Font (Headings)</label>
                        <select
                           className="w-full bg-void border border-pearl/20 p-4 text-pearl text-lg"
                           value={themeBuilder.fonts.display}
                           onChange={(e) => {
                              const newTheme = { ...themeBuilder, fonts: { ...themeBuilder.fonts, display: e.target.value } };
                              setThemeBuilder(newTheme);
                              applyTheme(newTheme);
                           }}
                        >
                           <option value="'Monument Extended', 'Syne', sans-serif">Monument Extended (Brutalist)</option>
                           <option value="'Playfair Display', serif">Playfair Display (Elegant)</option>
                           <option value="'Cinzel', serif">Cinzel (Classical)</option>
                           <option value="'Outfit', sans-serif">Outfit (Modern)</option>
                           <option value="'Space Grotesk', sans-serif">Space Grotesk (Tech)</option>
                           <option value="'Anton', sans-serif">Anton (Bold)</option>
                           <optgroup label="Arabic / Eastern">
                              <option value="'Amiri', serif">Amiri (Classic Naskh)</option>
                              <option value="'Aref Ruqaa', serif">Aref Ruqaa (Calligraphy)</option>
                              <option value="'Cairo', sans-serif">Cairo (Modern Kufic)</option>
                              <option value="'Rakkas', display">Rakkas (Display)</option>
                           </optgroup>
                        </select>
                        <p className="mt-4 text-4xl" style={{ fontFamily: themeBuilder.fonts.display }}>MURAQQA</p>
                     </div>

                     <div>
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-4 block">Body Font (Text)</label>
                        <select
                           className="w-full bg-void border border-pearl/20 p-4 text-pearl"
                           value={themeBuilder.fonts.body}
                           onChange={(e) => {
                              const newTheme = { ...themeBuilder, fonts: { ...themeBuilder.fonts, body: e.target.value } };
                              setThemeBuilder(newTheme);
                              applyTheme(newTheme);
                           }}
                        >
                           <option value="'Inter', 'Satoshi', sans-serif">Inter (Clean)</option>
                           <option value="'Lora', serif">Lora (Serif)</option>
                           <option value="'Quicksand', sans-serif">Quicksand (Rounded)</option>
                           <option value="'DM Sans', sans-serif">DM Sans (Geo)</option>
                           <option value="'Roboto', sans-serif">Roboto (Neutral)</option>
                           <option value="'Cormorant Garamond', serif">Cormorant (Elegant)</option>
                        </select>
                        <p className="mt-4 text-sm leading-relaxed" style={{ fontFamily: themeBuilder.fonts.body }}>
                           The quick brown fox jumps over the lazy dog. Contemporary art requires a canvas that breathes.
                        </p>
                     </div>

                     <div>
                        <label className="text-xs text-warm-gray uppercase tracking-widest mb-4 block">Urdu Font (مرقع)</label>
                        <select
                           className="w-full bg-void border border-pearl/20 p-4 text-pearl"
                           value={themeBuilder.fonts.urdu}
                           onChange={(e) => {
                              const newTheme = { ...themeBuilder, fonts: { ...themeBuilder.fonts, urdu: e.target.value } };
                              setThemeBuilder(newTheme);
                              applyTheme(newTheme);
                           }}
                        >
                           <option value="'Noto Nastaliq Urdu', serif">Noto Nastaliq Urdu (Traditional)</option>
                           <option value="'Amiri', serif">Amiri (Classic Arabic/Urdu)</option>
                           <option value="'Aref Ruqaa', serif">Aref Ruqaa (Calligraphic)</option>
                           <option value="'Scheherazade New', serif">Scheherazade New (Elegant)</option>
                           <option value="'Markazi Text', serif">Markazi Text (Modern)</option>
                           <option value="'Lateef', serif">Lateef (Clean Nastaliq)</option>
                        </select>
                        <p className="mt-4 text-3xl text-tangerine" style={{ fontFamily: themeBuilder.fonts.urdu }}>
                           مرقع
                        </p>
                     </div>
                  </div>
               </div>

            </div>
         )}

      </div>
   );
};
