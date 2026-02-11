import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { artistApi, uploadApi } from '../services/api';
import { Save, Upload, User, MapPin, Globe, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ArtistProfile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [artistId, setArtistId] = useState<string>('');
    const [formData, setFormData] = useState({
        fullName: '', // Read only
        bio: '',
        originCity: '',
        portfolioUrl: '',
        imageUrl: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Fetch Profile
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const { artist } = await artistApi.getMyProfile();
                setArtistId(artist.id);
                setFormData({
                    fullName: artist.user.fullName, // Cannot edit here
                    bio: artist.bio || '',
                    originCity: artist.originCity || '',
                    portfolioUrl: artist.portfolioUrl || '',
                    imageUrl: artist.imageUrl || ''
                });
            } catch (err: any) {
                console.error('Failed to fetch profile:', err);
                setError(err.message || 'Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear success message on change
        if (successMsg) setSuccessMsg(null);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Upload logic here - reusing uploadApi
            const url = await uploadApi.uploadImage(file);
            setFormData(prev => ({ ...prev, imageUrl: url }));
        } catch (err) {
            console.error('Image upload failed', err);
            alert('Failed to upload image');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setIsSaving(true);

        try {
            // Only send editable fields
            await artistApi.updateProfile(artistId, {
                bio: formData.bio,
                originCity: formData.originCity,
                portfolioUrl: formData.portfolioUrl,
                imageUrl: formData.imageUrl
            });
            setSuccessMsg('Profile updated successfully');
        } catch (err: any) {
            console.error('Update failed:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="pt-32 min-h-screen flex justify-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="pt-32 pb-20 px-6 md:px-12">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="font-serif text-4xl text-white">Edit Profile</h1>
                <button
                    onClick={() => navigate('/artist-dashboard')}
                    className="text-stone-500 hover:text-white transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-8 rounded-sm">
                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-900 text-red-500 text-sm">
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-900/20 border border-green-900 text-green-500 text-sm">
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Profile Image Section */}
                    <div className="flex items-start gap-8">
                        <div className="w-32 h-32 bg-stone-800 rounded-full overflow-hidden flex-shrink-0 border-2 border-stone-700 relative group">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-600">
                                    <User size={40} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                <Upload size={20} className="text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">Profile Image</h3>
                            <p className="text-stone-500 text-sm mb-4">Click the image to upload a new photo. JPG or PNG, max 5MB.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name (Read Only) */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Display Name</label>
                            <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 p-3 text-stone-400 cursor-not-allowed">
                                <User size={16} />
                                <span>{formData.fullName}</span>
                            </div>
                            <p className="text-[10px] text-stone-600 mt-1">To change your name, please contact support.</p>
                        </div>

                        {/* Origin City */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Based In (City)</label>
                            <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 focus-within:border-amber-500 transition-colors">
                                <span className="pl-3 text-stone-500"><MapPin size={16} /></span>
                                <input
                                    type="text"
                                    name="originCity"
                                    value={formData.originCity}
                                    onChange={handleChange}
                                    className="w-full bg-transparent p-3 text-white focus:outline-none placeholder:text-stone-700"
                                    placeholder="e.g. Lahore, Pakistan"
                                />
                            </div>
                        </div>

                        {/* Portfolio URL */}
                        <div className="col-span-2">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Portfolio / Website</label>
                            <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 focus-within:border-amber-500 transition-colors">
                                <span className="pl-3 text-stone-500"><Globe size={16} /></span>
                                <input
                                    type="url"
                                    name="portfolioUrl"
                                    value={formData.portfolioUrl}
                                    onChange={handleChange}
                                    className="w-full bg-transparent p-3 text-white focus:outline-none placeholder:text-stone-700"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="col-span-2">
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Biography</label>
                            <div className="relative bg-stone-950 border border-stone-800 focus-within:border-amber-500 transition-colors">
                                <span className="absolute left-3 top-3 text-stone-500"><FileText size={16} /></span>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={6}
                                    className="w-full bg-transparent p-3 pl-10 text-white focus:outline-none placeholder:text-stone-700 resize-none"
                                    placeholder="Tell us about yourself and your art..."
                                    maxLength={2000}
                                />
                            </div>
                            <div className="text-right text-[10px] text-stone-600 mt-1">
                                {formData.bio.length}/2000 characters
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-stone-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 flex items-center gap-2 text-sm uppercase tracking-widest transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} /> Save Changes
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
          </div>
        </div>
    );
};
