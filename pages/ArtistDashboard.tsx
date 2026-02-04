import React, { useState, useEffect } from 'react';
import { BarChart, Upload, DollarSign, Image as ImageIcon, X, Save, Eye, Edit2, Trash2, MoreHorizontal, CheckCircle, Plus } from 'lucide-react';
import { useGallery } from '../context/GalleryContext';
import { useCurrency } from '../App';
import { Artwork, PrintSizeOption, PrintOptions } from '../types';
import { uploadApi, artistApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const ArtistDashboard: React.FC = () => {
   const { artworks, addArtwork, updateArtwork, deleteArtwork } = useGallery();
   const { convertPrice } = useCurrency();
   const { user } = useAuth();

   // Local State
   const [isFormOpen, setIsFormOpen] = useState(false);
   const [isDetailsOpen, setIsDetailsOpen] = useState(false);
   const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
   const [artistProfile, setArtistProfile] = useState<{ id: string, name: string } | null>(null);

   useEffect(() => {
      const fetchProfile = async () => {
         try {
            const { artist } = await artistApi.getMyProfile();
            setArtistProfile({ id: artist.id, name: artist.user.fullName });
         } catch (error) {
            console.error('Failed to fetch artist profile:', error);
         }
      };
      fetchProfile();
   }, []);

   // Form State
   const initialFormState: Partial<Artwork> = {
      title: '',
      price: 0,
      medium: '',
      dimensions: '',
      year: new Date().getFullYear(),
      category: 'Abstract',
      description: '',
      imageUrl: '',
      inStock: true,
      printOptions: { enabled: false, sizes: [] },
   };
   const [formData, setFormData] = useState<Partial<Artwork>>(initialFormState);
   const [isUploading, setIsUploading] = useState(false);

   // Print options helpers
   const printOptions = formData.printOptions || { enabled: false, sizes: [] };

   const setPrintEnabled = (enabled: boolean) => {
      setFormData(prev => ({
         ...prev,
         printOptions: { ...printOptions, enabled },
      }));
   };

   const addPrintSize = () => {
      setFormData(prev => ({
         ...prev,
         printOptions: {
            ...printOptions,
            sizes: [...printOptions.sizes, { name: '', dimensions: '', price: 0 }],
         },
      }));
   };

   const updatePrintSize = (index: number, field: keyof PrintSizeOption, value: string | number) => {
      const newSizes = [...printOptions.sizes];
      newSizes[index] = { ...newSizes[index], [field]: value };
      setFormData(prev => ({
         ...prev,
         printOptions: { ...printOptions, sizes: newSizes },
      }));
   };

   const removePrintSize = (index: number) => {
      setFormData(prev => ({
         ...prev,
         printOptions: {
            ...printOptions,
            sizes: printOptions.sizes.filter((_, i) => i !== index),
         },
      }));
   };

   // Derived Data
   const artistArtworks = artworks.filter(a => artistProfile && a.artistId === artistProfile.id);
   const totalEarnings = artistArtworks.reduce((sum, art) => sum + (art.inStock ? 0 : art.price), 0); // Mock logic: sold items calculated
   const totalViews = artistArtworks.length * 1243; // Mock views

   // Handlers
   const handleOpenUpload = () => {
      setSelectedArtwork(null);
      setFormData(initialFormState);
      setIsFormOpen(true);
   };

   const handleOpenEdit = (art: Artwork) => {
      setSelectedArtwork(art);
      setFormData({
         ...art,
         printOptions: art.printOptions || { enabled: false, sizes: [] },
      });
      setIsFormOpen(true);
   };

   const handleOpenDetails = (art: Artwork) => {
      setSelectedArtwork(art);
      setIsDetailsOpen(true);
   };

   const handleDelete = (id: string) => {
      if (window.confirm('Are you sure you want to remove this artwork from your portfolio?')) {
         deleteArtwork(id);
         if (isDetailsOpen) setIsDetailsOpen(false);
      }
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (selectedArtwork) {
         // Edit Mode
         updateArtwork(selectedArtwork.id, formData);
      } else {
         // Create Mode
         const newArtwork: Artwork = {
            ...formData as Artwork,
            id: Date.now().toString(),
            artistId: artistProfile?.id || '',
            artistName: artistProfile?.name || '',
            imageUrl: formData.imageUrl || `https://picsum.photos/800/1000?random=${Date.now()}`,
            reviews: [],
            provenanceId: `BLK-${Date.now().toString().slice(-6)}`,
         };
         addArtwork(newArtwork);
      }
      setIsFormOpen(false);
   };


   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Basic validation
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
         setFormData(prev => ({ ...prev, imageUrl: url }));
      } catch (error) {
         console.error('Upload failed:', error);
         alert('Failed to upload image. Please try again.');
      } finally {
         setIsUploading(false);
      }
   };

   return (
      <div className="pt-32 pb-12 max-w-7xl mx-auto px-4">
         {/* Header */}
         <div className="flex justify-between items-center mb-12">
            <div>
               <h1 className="font-serif text-4xl text-white">Artist Studio</h1>
               <p className="text-stone-500 mt-1">Welcome back, {artistProfile?.name || 'Artist'}</p>
            </div>
            <button
               onClick={handleOpenUpload}
               className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 flex items-center gap-2 text-sm uppercase tracking-widest shadow-lg shadow-amber-900/20"
            >
               <Upload size={16} /> Upload New Work
            </button>
            <Link
               to="/artist/profile"
               className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors ml-6 px-4 py-2 border border-stone-800 hover:border-stone-600"
            >
               <Edit2 size={16} /> Edit Profile
            </Link>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-stone-900 p-6 border border-stone-800">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-stone-500 text-xs uppercase tracking-widest">Est. Revenue (Sold)</p>
                     <h3 className="text-3xl text-white font-serif mt-2">{convertPrice(totalEarnings)}</h3>
                  </div>
                  <DollarSign className="text-amber-500" />
               </div>
               <div className="w-full bg-stone-800 h-1 mt-4"><div className="w-3/4 bg-amber-500 h-1"></div></div>
            </div>
            <div className="bg-stone-900 p-6 border border-stone-800">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-stone-500 text-xs uppercase tracking-widest">Portfolio Size</p>
                     <h3 className="text-3xl text-white font-serif mt-2">{artistArtworks.length} Items</h3>
                  </div>
                  <ImageIcon className="text-amber-500" />
               </div>
            </div>
            <div className="bg-stone-900 p-6 border border-stone-800">
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <p className="text-stone-500 text-xs uppercase tracking-widest">Total Impressions</p>
                     <h3 className="text-3xl text-white font-serif mt-2">{totalViews.toLocaleString()}</h3>
                  </div>
                  <BarChart className="text-amber-500" />
               </div>
            </div>
         </div>

         <h2 className="font-serif text-2xl text-white mb-6">Portfolio Management</h2>

         {/* Artworks Table */}
         <div className="bg-stone-900 border border-stone-800 overflow-hidden rounded-sm">
            {artistArtworks.length === 0 ? (
               <div className="p-12 text-center text-stone-500">
                  <p className="mb-4">Your portfolio is currently empty.</p>
                  <button onClick={handleOpenUpload} className="text-amber-500 hover:underline">Upload your first masterpiece</button>
               </div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-400">
                     <thead className="bg-stone-950 text-stone-500 uppercase text-xs">
                        <tr>
                           <th className="p-4">Artwork</th>
                           <th className="p-4">Category</th>
                           <th className="p-4">Status</th>
                           <th className="p-4">Price</th>
                           <th className="p-4">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-stone-800">
                        {artistArtworks.map(art => (
                           <tr key={art.id} className="hover:bg-stone-800/50 transition-colors">
                              <td className="p-4 flex items-center gap-4">
                                 <img src={art.imageUrl} alt={art.title} className="w-12 h-12 object-cover rounded-sm border border-stone-700" />
                                 <div>
                                    <span className="block text-white font-medium">{art.title}</span>
                                    <span className="text-xs text-stone-500">{art.year} • {art.medium}</span>
                                 </div>
                              </td>
                              <td className="p-4">{art.category}</td>
                              <td className="p-4">
                                 <span className={`px-2 py-1 text-xs rounded border ${art.inStock ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-stone-700 text-stone-500 bg-stone-800'}`}>
                                    {art.inStock ? 'Active' : 'Sold'}
                                 </span>
                              </td>
                              <td className="p-4 font-mono">{convertPrice(art.price)}</td>
                              <td className="p-4">
                                 <div className="flex gap-3">
                                    <button onClick={() => handleOpenDetails(art)} title="View Details" className="text-stone-400 hover:text-white transition-colors"><Eye size={18} /></button>
                                    <button onClick={() => handleOpenEdit(art)} title="Edit" className="text-stone-400 hover:text-amber-500 transition-colors"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(art.id)} title="Delete" className="text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </div>

         {/* --- MODALS --- */}

         {/* Upload / Edit Modal */}
         {isFormOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-stone-900 border border-stone-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl animate-fade-in">
                  <div className="sticky top-0 bg-stone-900 border-b border-stone-800 p-6 flex justify-between items-center z-10">
                     <h2 className="font-serif text-2xl text-white">{selectedArtwork ? 'Edit Masterpiece' : 'Upload New Work'}</h2>
                     <button onClick={() => setIsFormOpen(false)} className="text-stone-400 hover:text-white"><X size={24} /></button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <div>
                              <label className="block text-xs uppercase text-stone-500 mb-1">Title</label>
                              <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-xs uppercase text-stone-500 mb-1">Price (PKR)</label>
                                 <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                              </div>
                              <div>
                                 <label className="block text-xs uppercase text-stone-500 mb-1">Year</label>
                                 <input required type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                              </div>
                           </div>
                           <div>
                              <label className="block text-xs uppercase text-stone-500 mb-1">Category</label>
                              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })} className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none">
                                 <option value="Abstract">Abstract</option>
                                 <option value="Calligraphy">Calligraphy</option>
                                 <option value="Landscape">Landscape</option>
                                 <option value="Miniature">Miniature</option>
                                 <option value="Portrait">Portrait</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs uppercase text-stone-500 mb-1">Medium</label>
                              <input required type="text" placeholder="e.g. Oil on Canvas" value={formData.medium} onChange={e => setFormData({ ...formData, medium: e.target.value })} className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                           </div>
                           <div>
                              <label className="block text-xs uppercase text-stone-500 mb-1">Dimensions</label>
                              <input required type="text" placeholder="e.g. 24x36 inches" value={formData.dimensions} onChange={e => setFormData({ ...formData, dimensions: e.target.value })} className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div>
                              <label className="block text-xs uppercase text-stone-500 mb-1">Artwork Image</label>
                              <div className="mt-2 aspect-square bg-stone-950 border border-stone-800 flex flex-col items-center justify-center overflow-hidden relative group">
                                 {formData.imageUrl ? (
                                    <>
                                       <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm border border-white/20">
                                             Change Image
                                             <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                          </label>
                                       </div>
                                    </>
                                 ) : (
                                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-stone-900 transition-colors">
                                       {isUploading ? (
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-2"></div>
                                       ) : (
                                          <ImageIcon className="mx-auto mb-2 opacity-50 text-stone-600" size={32} />
                                       )}
                                       <span className="text-xs text-stone-500">{isUploading ? 'Uploading...' : 'Click to Upload Image'}</span>
                                       <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                 )}
                              </div>
                              <p className="text-[10px] text-stone-600 mt-2 text-center">Supported: JPG, PNG, WEBP (Max 5MB)</p>
                           </div>
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs uppercase text-stone-500 mb-1">Description</label>
                        <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-stone-950 border border-stone-700 p-3 text-white focus:border-amber-500 outline-none" />
                     </div>

                     {/* Print Options Configuration */}
                     <div className="border border-stone-800 rounded-lg p-5 space-y-4">
                        <div className="flex items-center justify-between">
                           <div>
                              <h4 className="text-white text-sm font-medium">Print Purchases</h4>
                              <p className="text-stone-500 text-xs mt-0.5">Allow customers to buy fabric canvas prints of this artwork</p>
                           </div>
                           <button
                              type="button"
                              onClick={() => setPrintEnabled(!printOptions.enabled)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${printOptions.enabled ? 'bg-amber-600' : 'bg-stone-700'}`}
                           >
                              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${printOptions.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                           </button>
                        </div>

                        {printOptions.enabled && (
                           <div className="space-y-3 pt-3 border-t border-stone-800">
                              <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase tracking-widest mb-2">
                                 <div className="w-2 h-2 rounded-full bg-amber-500/40"></div>
                                 Medium: Fabric Canvas (Fixed)
                              </div>

                              {/* Size Rows */}
                              {printOptions.sizes.map((size, idx) => (
                                 <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-3">
                                       <input
                                          type="text"
                                          placeholder="Size name"
                                          value={size.name}
                                          onChange={e => updatePrintSize(idx, 'name', e.target.value)}
                                          className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-white text-xs focus:border-amber-500 outline-none"
                                       />
                                    </div>
                                    <div className="col-span-4">
                                       <input
                                          type="text"
                                          placeholder="e.g. 11.7 x 16.5 inches"
                                          value={size.dimensions}
                                          onChange={e => updatePrintSize(idx, 'dimensions', e.target.value)}
                                          className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-white text-xs focus:border-amber-500 outline-none"
                                       />
                                    </div>
                                    <div className="col-span-4">
                                       <input
                                          type="number"
                                          placeholder="Price (PKR)"
                                          value={size.price || ''}
                                          onChange={e => updatePrintSize(idx, 'price', Number(e.target.value))}
                                          className="w-full bg-stone-950 border border-stone-700 px-3 py-2 text-white text-xs focus:border-amber-500 outline-none"
                                       />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                       <button
                                          type="button"
                                          onClick={() => removePrintSize(idx)}
                                          className="text-stone-600 hover:text-red-500 transition-colors"
                                       >
                                          <X size={16} />
                                       </button>
                                    </div>
                                 </div>
                              ))}

                              <button
                                 type="button"
                                 onClick={addPrintSize}
                                 className="flex items-center gap-2 text-amber-500 hover:text-amber-400 text-xs uppercase tracking-widest transition-colors mt-2"
                              >
                                 <Plus size={14} /> Add Print Size
                              </button>
                           </div>
                        )}
                     </div>

                     <div className="pt-4 border-t border-stone-800 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-sm text-stone-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 text-sm uppercase tracking-widest flex items-center gap-2">
                           <Save size={16} /> Save Artwork
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Details Modal */}
         {isDetailsOpen && selectedArtwork && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-stone-900 border border-stone-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl flex flex-col md:flex-row animate-fade-in">

                  {/* Image Side */}
                  <div className="md:w-1/2 bg-black relative">
                     <img src={selectedArtwork.imageUrl} alt={selectedArtwork.title} className="w-full h-full object-contain" />
                     <div className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur px-3 py-1 rounded-full text-xs text-white border border-stone-700">
                        {selectedArtwork.category}
                     </div>
                  </div>

                  {/* Info Side */}
                  <div className="md:w-1/2 p-8 flex flex-col">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h2 className="font-serif text-3xl text-white mb-1">{selectedArtwork.title}</h2>
                           <p className="text-amber-500 text-sm uppercase tracking-widest">{selectedArtwork.artistName}</p>
                        </div>
                        <button onClick={() => setIsDetailsOpen(false)} className="text-stone-400 hover:text-white"><X size={24} /></button>
                     </div>

                     <div className="space-y-6 flex-1">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                           <div>
                              <p className="text-stone-500 text-xs uppercase">Price</p>
                              <p className="text-white font-mono text-lg">{convertPrice(selectedArtwork.price)}</p>
                           </div>
                           <div>
                              <p className="text-stone-500 text-xs uppercase">Status</p>
                              <p className={selectedArtwork.inStock ? "text-green-500" : "text-stone-400"}>
                                 {selectedArtwork.inStock ? "Available" : "Sold Out"}
                              </p>
                           </div>
                           <div>
                              <p className="text-stone-500 text-xs uppercase">Dimensions</p>
                              <p className="text-stone-300">{selectedArtwork.dimensions}</p>
                           </div>
                           <div>
                              <p className="text-stone-500 text-xs uppercase">Medium</p>
                              <p className="text-stone-300">{selectedArtwork.medium}</p>
                           </div>
                        </div>

                        <div>
                           <p className="text-stone-500 text-xs uppercase mb-2">Description</p>
                           <p className="text-stone-300 text-sm leading-relaxed">{selectedArtwork.description}</p>
                        </div>

                        <div className="bg-stone-950 p-4 border border-stone-800 rounded">
                           <h4 className="text-white font-serif mb-3">Performance Analytics</h4>
                           <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                 <p className="text-stone-500 text-[10px] uppercase">Views</p>
                                 <p className="text-white font-mono">1,240</p>
                              </div>
                              <div>
                                 <p className="text-stone-500 text-[10px] uppercase">Saves</p>
                                 <p className="text-white font-mono">85</p>
                              </div>
                              <div>
                                 <p className="text-stone-500 text-[10px] uppercase">In Carts</p>
                                 <p className="text-amber-500 font-mono">3</p>
                              </div>
                           </div>
                        </div>

                        <div className="bg-stone-950 p-4 border border-stone-800 rounded flex items-center gap-3">
                           <CheckCircle className="text-green-500" size={20} />
                           <div>
                              <p className="text-xs text-stone-400 uppercase">Provenance ID</p>
                              <p className="text-white font-mono text-xs">{selectedArtwork.provenanceId || 'N/A'}</p>
                           </div>
                        </div>
                     </div>

                     <div className="pt-6 mt-6 border-t border-stone-800 flex justify-end gap-3">
                        <button onClick={() => handleDelete(selectedArtwork.id)} className="flex items-center gap-2 px-4 py-2 border border-stone-700 text-stone-400 hover:text-red-500 hover:border-red-900 transition-colors text-xs uppercase">
                           <Trash2 size={14} /> Delete
                        </button>
                        <button onClick={() => { setIsDetailsOpen(false); handleOpenEdit(selectedArtwork); }} className="flex items-center gap-2 px-6 py-2 bg-stone-800 hover:bg-stone-700 text-white transition-colors text-xs uppercase">
                           <Edit2 size={14} /> Edit Work
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
