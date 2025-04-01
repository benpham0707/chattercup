'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Image from 'next/image';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    full_name: '',
    title: '',
    bio: '',
    location: '',
    website: '',
    linkedin: '',
    twitter: '',
    user_type: 'guest',
    sector: '',
    industry: '',
    interests: [],
    favorite_coffee_shops: [],
    topics: [],
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  
  // For tag inputs
  const [interestInput, setInterestInput] = useState('');
  const [coffeeShopInput, setCoffeeShopInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    async function getProfile() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/auth/signin');
          return;
        }
        
        setUser(session.user);
        
        // Fetch profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            title: data.title || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
            linkedin: data.linkedin || '',
            twitter: data.twitter || '',
            user_type: data.user_type || 'guest',
            sector: data.sector || '',
            industry: data.industry || '',
            interests: data.interests || [],
            favorite_coffee_shops: data.favorite_coffee_shops || [],
            topics: data.topics || [],
          });
          
          if (data.profile_photo_url) {
            setProfileImageUrl(data.profile_photo_url);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setError('');
      setSuccess('');
      
      if (!user) return;
      
      let profilePhotoUrl = profile.profile_photo_url;
      
      // Upload profile image if selected
      // In the handleProfileUpdate function:
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, profileImage, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error(`Error uploading image: ${uploadError.message}`);
        }
        
        if (data) {
          // Get the public URL with the correct domain
          const { data: urlData } = await supabase.storage
            .from('profile-pictures')
            .getPublicUrl(data.path);
            
          console.log('Generated image URL:', urlData.publicUrl);
          
          // Store the URL without any cache-busting parameters
          profilePhotoUrl = urlData.publicUrl;
          setProfileImageUrl(urlData.publicUrl);
        }
      }
      
      // Update profile with more detailed error logging
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          title: profile.title,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          linkedin: profile.linkedin,
          twitter: profile.twitter,
          user_type: profile.user_type,
          profile_photo_url: profilePhotoUrl,
          sector: profile.sector,
          industry: profile.industry,
          interests: profile.interests || [],
          favorite_coffee_shops: profile.favorite_coffee_shops || [],
          topics: profile.topics || [],
          updated_at: new Date().toISOString(),
        });
        
      if (error) {
        console.error('Detailed profile update error:', error);
        throw new Error(error.message);
      }
      
      setSuccess('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }
      
      setProfileImage(file);
      setProfileImageUrl(URL.createObjectURL(file));
    }
  };

  // Helper functions for tag inputs
  const addInterest = () => {
    if (interestInput.trim() && !profile.interests.includes(interestInput.trim())) {
      setProfile({
        ...profile,
        interests: [...profile.interests, interestInput.trim()]
      });
      setInterestInput('');
    }
  };

  const removeInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter((i: string) => i !== interest)
    });
  };

  const addCoffeeShop = () => {
    if (coffeeShopInput.trim() && !profile.favorite_coffee_shops.includes(coffeeShopInput.trim())) {
      setProfile({
        ...profile,
        favorite_coffee_shops: [...profile.favorite_coffee_shops, coffeeShopInput.trim()]
      });
      setCoffeeShopInput('');
    }
  };

  const removeCoffeeShop = (shop: string) => {
    setProfile({
      ...profile,
      favorite_coffee_shops: profile.favorite_coffee_shops.filter((s: string) => s !== shop)
    });
  };

  const addTopic = () => {
    if (topicInput.trim() && !profile.topics.includes(topicInput.trim())) {
      setProfile({
        ...profile,
        topics: [...profile.topics, topicInput.trim()]
      });
      setTopicInput('');
    }
  };

  const removeTopic = (topic: string) => {
    setProfile({
      ...profile,
      topics: profile.topics.filter((t: string) => t !== topic)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update your profile information and preferences
          </p>
        </div>
        
        <div className="mt-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Error updating profile: {error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleProfileUpdate}>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                <p className="mt-1 text-sm text-gray-500">
                  This information will be displayed publicly
                </p>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Profile Photo */}
                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                    <div className="mt-2 flex items-center">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                        {profileImageUrl ? (
                          <Image
                            src={profileImageUrl}
                            alt="Profile"
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                            unoptimized={true}
                            onError={() => {
                              console.error('Image load error for URL:', profileImageUrl);
                              // Don't clear the URL immediately, as it might just be a temporary issue
                              // Instead, show a fallback but keep the URL for future attempts
                            }}
                          />
                        ) : (
                          <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                      <label
                        htmlFor="profile-photo-upload"
                        className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        Change
                        <input
                          id="profile-photo-upload"
                          name="profile-photo-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="sm:col-span-3">
                    <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="full-name"
                        id="full-name"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Title/Headline */}
                  <div className="sm:col-span-3">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Headline
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={profile.title}
                        onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        placeholder="e.g. Software Engineer at Google"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Sector */}
                  <div className="sm:col-span-3">
                    <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
                      Sector
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="sector"
                        id="sector"
                        value={profile.sector}
                        onChange={(e) => setProfile({ ...profile, sector: e.target.value })}
                        placeholder="e.g. Technology"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="sm:col-span-3">
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                      Industry
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="industry"
                        id="industry"
                        value={profile.industry}
                        onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                        placeholder="e.g. Software Development"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="sm:col-span-6">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="Tell others about yourself, your expertise, and what you can help with"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Interests */}
                  <div className="sm:col-span-6">
                    <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                      Interests
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="interests"
                        id="interests"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                        placeholder="Add an interest and press Enter"
                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={addInterest}
                        className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.interests.map((interest: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeInterest(interest)}
                            className="ml-1.5 inline-flex text-indigo-400 hover:text-indigo-500"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Favorite Coffee Shops */}
                  <div className="sm:col-span-6">
                    <label htmlFor="coffee-shops" className="block text-sm font-medium text-gray-700">
                      Favorite Coffee Shops
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="coffee-shops"
                        id="coffee-shops"
                        value={coffeeShopInput}
                        onChange={(e) => setCoffeeShopInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCoffeeShop())}
                        placeholder="Add a coffee shop and press Enter"
                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={addCoffeeShop}
                        className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.favorite_coffee_shops.map((shop: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                        >
                          {shop}
                          <button
                            type="button"
                            onClick={() => removeCoffeeShop(shop)}
                            className="ml-1.5 inline-flex text-amber-400 hover:text-amber-500"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="sm:col-span-6">
                    <label htmlFor="topics" className="block text-sm font-medium text-gray-700">
                      Topics I Can Talk About
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="topics"
                        id="topics"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                        placeholder="Add a topic and press Enter"
                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={addTopic}
                        className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.topics.map((topic: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {topic}
                          <button
                            type="button"
                            onClick={() => removeTopic(topic)}
                            className="ml-1.5 inline-flex text-green-400 hover:text-green-500"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="sm:col-span-3">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="e.g. San Francisco, CA"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="sm:col-span-3">
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <div className="mt-1">
                      <input
                        type="url"
                        name="website"
                        id="website"
                        value={profile.website}
                        onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                        placeholder="https://example.com"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="sm:col-span-3">
                    <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                      LinkedIn
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="linkedin"
                        id="linkedin"
                        value={profile.linkedin}
                        onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                        placeholder="username"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Twitter */}
                  <div className="sm:col-span-3">
                    <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                      Twitter
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="twitter"
                        id="twitter"
                        value={profile.twitter}
                        onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                        placeholder="username"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* User Type */}
                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">User Type</label>
                    <div className="mt-2">
                      <div className="flex items-center">
                        <input
                          id="user-type-host"
                          name="user-type"
                          type="checkbox"
                          checked={profile.user_type === 'host'}
                          onChange={(e) => setProfile({ ...profile, user_type: e.target.checked ? 'host' : 'guest' })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="user-type-host" className="ml-3 block text-sm font-medium text-gray-700">
                          I want to offer coffee chats (Host)
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Share your expertise and earn money by hosting coffee chats
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {updating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}