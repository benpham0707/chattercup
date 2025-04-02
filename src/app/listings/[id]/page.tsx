'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  format: 'virtual' | 'in-person' | 'both';
  location: string | null;
  meeting_link: string | null;
  topics: string[];
  availability: string[];
  created_at: string;
  updated_at: string;
};

export default function ListingDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);
        
        // Fetch listing without joining with profiles
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (error) {
          console.error('Error fetching listing:', error);
          throw error;
        }
        
        console.log('Fetched listing:', data);
        setListing(data);
      } catch (error: any) {
        console.error('Error fetching listing:', error);
        setError(error.message || 'Failed to fetch listing details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchListing();
  }, [params]); // Use params as dependency

  const handleBooking = async () => {
    if (!currentUser) {
      router.push('/auth/signin');
      return;
    }
    
    // For now, just show an alert
    alert('Booking functionality will be implemented soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-12 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-5 sm:p-6 bg-red-50 rounded-md">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Link
                href="/marketplace"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-5 sm:p-6 bg-yellow-50 rounded-md">
            <h3 className="text-lg font-medium text-yellow-800">Listing Not Found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The listing you're looking for doesn't exist or has been removed.</p>
            </div>
            <div className="mt-4">
              <Link
                href="/marketplace"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Hosted by a ChatterCup expert
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{listing.description}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Price</dt>
                <dd className="mt-1 text-sm text-gray-900">${listing.price}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Duration</dt>
                <dd className="mt-1 text-sm text-gray-900">{listing.duration} minutes</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Format</dt>
                <dd className="mt-1 text-sm text-gray-900">{listing.format}</dd>
              </div>
              
              {listing.location && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{listing.location}</dd>
                </div>
              )}
              
              {listing.meeting_link && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Meeting Link</dt>
                  <dd className="mt-1 text-sm text-gray-900">{listing.meeting_link}</dd>
                </div>
              )}
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Topics</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-2">
                    {listing.topics && listing.topics.map((topic, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {topic}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Availability</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-2">
                    {listing.availability && listing.availability.map((time, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {time}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="px-4 py-5 bg-gray-50 sm:px-6">
            {currentUser?.id === listing.user_id ? (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">This is your listing</p>
                <button
                  type="button"
                  onClick={() => router.push(`/listings/${listing.id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Listing
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push(`/bookings/schedule/${listing.id}`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Schedule Coffee Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}