'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  tags: string[];
  host_id: string;
  created_at: string;
  host: {
    full_name: string;
    headline: string;
    profile_photo_url: string;
  };
};

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    async function fetchListings() {
      try {
        const { data, error } = await supabase
          .from('chat_listings')
          .select(`
            *,
            host:host_id(full_name, headline, profile_photo_url)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Extract all unique tags from listings
        const allTags = data?.flatMap(listing => listing.tags || []) || [];
        const uniqueTags = [...new Set(allTags)];
        setAvailableTags(uniqueTags);
        
        setListings(data as Listing[] || []);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = searchTerm === '' || 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.host.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => listing.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Marketplace header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Expert Marketplace</h1>
            <p className="mt-2 text-gray-600">Find professionals for meaningful coffee chats</p>
          </div>
        </header>

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Search and filter */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="md:col-span-3">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                      Search
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="text"
                        name="search"
                        id="search"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                        placeholder="Search by name, title, or description"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags filter */}
                {availableTags.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700">Filter by tags</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            selectedTags.includes(tag)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Listings grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => (
                  <Link 
                    key={listing.id} 
                    href={`/listings/${listing.id}`}
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          {listing.host.profile_photo_url ? (
                            <Image
                              src={listing.host.profile_photo_url}
                              alt={listing.host.full_name || 'Host'}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-800 font-medium">
                              {listing.host.full_name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {listing.host.full_name || 'Anonymous Host'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {listing.host.headline || 'Expert'}
                          </p>
                        </div>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2 truncate">{listing.title}</h4>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{listing.description}</p>
                      
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1">
                          {listing.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {listing.tags.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{listing.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                        <div className="text-indigo-600 font-medium">
                          ${(listing.price / 100).toFixed(2)}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {listing.duration} minutes
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-12 sm:px-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No listings found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}