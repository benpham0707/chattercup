import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type ProfileFormProps = {
  userId: string;
  onComplete?: () => void;
};

export default function ProfileForm({ userId, onComplete }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileData, setProfileData] = useState({
    full_name: '',
    role: '',
    bio: '',
    industry: '',
    company: '',
    tags: [] as string[],
    favorite_coffee_shop: '',
    offers_chats: false,
    requests_chats: false,
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        
        if (data) {
          setProfileData({
            full_name: data.full_name || '',
            role: data.role || '',
            bio: data.bio || '',
            industry: data.industry || '',
            company: data.company || '',
            tags: data.tags || [],
            favorite_coffee_shop: data.favorite_coffee_shop || '',
            offers_chats: data.offers_chats || false,
            requests_chats: data.requests_chats || false,
          });
          
          if (data.profile_photo_url) {
            setPhotoPreview(data.profile_photo_url);
          }
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error.message);
      }
    }

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProfileData({ ...profileData, [name]: checked });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !profileData.tags.includes(tagInput.trim())) {
      setProfileData({
        ...profileData,
        tags: [...profileData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProfileData({
      ...profileData,
      tags: profileData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let profile_photo_url = photoPreview;

      // Upload profile photo if changed
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `profile-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, profilePhoto);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
        profile_photo_url = data.publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...profileData,
          profile_photo_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage('Profile updated successfully!');
      if (onComplete) onComplete();
    } catch (error: any) {
      setMessage(`Error updating profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Profile Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
          <div className="mt-1 flex items-center space-x-5">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProfilePhoto(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div>
              <label htmlFor="photo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                Change
              </label>
              <input
                id="photo-upload"
                name="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={profileData.full_name}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <input
            type="text"
            id="role"
            name="role"
            value={profileData.role}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            value={profileData.bio}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
            Industry
          </label>
          <input
            type="text"
            id="industry"
            name="industry"
            value={profileData.industry}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Company */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={profileData.company}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            "Talk to me about..." Tags
          </label>
          <div className="mt-1 flex">
            <input
              type="text"
              id="tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add a tag"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button
              type="button"
              onClick={addTag}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {profileData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 inline-flex text-indigo-500 hover:text-indigo-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Favorite Coffee Shop */}
        <div>
          <label htmlFor="favorite_coffee_shop" className="block text-sm font-medium text-gray-700">
            Favorite Coffee Shop
          </label>
          <input
            type="text"
            id="favorite_coffee_shop"
            name="favorite_coffee_shop"
            value={profileData.favorite_coffee_shop}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Chat Preferences */}
        <div className="space-y-2">
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="offers_chats"
                name="offers_chats"
                type="checkbox"
                checked={profileData.offers_chats}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="offers_chats" className="font-medium text-gray-700">
                I want to offer chats (become a host)
              </label>
            </div>
          </div>
          <div className="relative flex items-start">
            <div className="flex items-center h-5">
              <input
                id="requests_chats"
                name="requests_chats"
                type="checkbox"
                checked={profileData.requests_chats}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="requests_chats" className="font-medium text-gray-700">
                I want to request chats (become a guest)
              </label>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}