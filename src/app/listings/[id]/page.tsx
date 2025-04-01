'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ListingDetail() {
  const [listing, setListing] = useState<any>(null);
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [bookingMessage, setBookingMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  useEffect(() => {
    async function fetchListing() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        // Fetch listing details
        const { data: listingData, error: listingError } = await supabase
          .from('chat_listings')
          .select('*')
          .eq('id', listingId)
          .single();

        if (listingError) throw listingError;
        setListing(listingData);

        // Fetch host details
        if (listingData.host_id) {
          const { data: hostData, error: hostError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', listingData.host_id)
            .single();

          if (hostError) throw hostError;
          setHost(hostData);
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/signin?redirect=' + encodeURIComponent(`/listings/${listingId}`));
      return;
    }
    
    if (!bookingDate || !bookingTime) {
      setError('Please select both date and time for your booking');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const scheduledAt = new Date(`${bookingDate}T${bookingTime}`);
      
      // Check if date is valid
      if (isNaN(scheduledAt.getTime())) {
        throw new Error('Invalid date or time selected');
      }
      
      // Check if date is in the future
      if (scheduledAt < new Date()) {
        throw new Error('Please select a future date and time');
      }
      
      const bookingData = {
        listing_id: listingId,
        guest_id: user.id,
        host_id: listing.host_id,
        scheduled_at: scheduledAt.toISOString(),
        message: bookingMessage,
        status: 'pending',
        price: listing.price,
        duration: listing.duration,
        created_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();
        
      if (error) throw error;
      
      setSuccess('Booking request sent successfully! The host will confirm your request soon.');
      setBookingDate('');
      setBookingTime('');
      setBookingMessage('');
      
      // Redirect to booking detail after a short delay
      setTimeout(() => {
        if (data && data[0]) {
          router.push(`/bookings/${data[0].id}`);
        }
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h2>
            <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
            <Link href="/marketplace" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnListing = user && user.id === listing.host_id;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Listing Details */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          {listing.duration} minute chat • ${(listing.price / 100).toFixed(2)}
                        </p>
                      </div>
                      {isOwnListing && (
                        <Link
                          href={`/listings/edit/${listing.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Edit Listing
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {listing.tags && listing.tags.length > 0 && (
                    <div className="px-4 py-3 sm:px-6 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {listing.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Description */}
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Description</h3>
                    <div className="mt-3 prose prose-sm max-w-none text-gray-500">
                      <p className="whitespace-pre-line">{listing.description}</p>
                    </div>
                  </div>
                  
                  {/* What to expect */}
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">What to Expect</h3>
                    <div className="mt-3 prose prose-sm max-w-none text-gray-500">
                      <p className="whitespace-pre-line">{listing.expectations || 'The host has not provided specific details about what to expect during this chat.'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Host Profile & Booking */}
              <div className="space-y-6">
                {/* Host Profile */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">About the Host</h3>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="flex items-center">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                        {host?.profile_photo_url ? (
                          <Image
                            src={host.profile_photo_url}
                            alt={host.full_name || 'Host'}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-800 font-medium text-xl">
                            {host?.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          {host?.full_name || 'Anonymous Host'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {host?.headline || 'Expert'}
                        </p>
                      </div>
                    </div>
                    
                    {host?.bio && (
                      <div className="mt-4 text-sm text-gray-500">
                        <p className="whitespace-pre-line">{host.bio}</p>
                      </div>
                    )}
                    
                    {/* Social links */}
                    <div className="mt-4 flex space-x-3">
                      {host?.linkedin_url && (
                        <a href={host.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                          <span className="sr-only">LinkedIn</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                      {host?.twitter_url && (
                        <a href={host.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                          <span className="sr-only">Twitter</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      )}
                      {host?.website && (
                        <a href={host.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                          <span className="sr-only">Website</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 0a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5c0 .526-.27.988-.659 1.256a6.012 6.012 0 01-2.708 1.912C5.21 11.773 5 12.714 5 13c0 .374.356.875.875.875h1.376c.839 0 1.749-.63 1.749-1.469 0-.276.224-.5.5-.5s.5.224.5.5c0 1.36-1.389 2.469-2.749 2.469H5.875C4.841 14.875 4 14.034 4 13c0-.656.31-1.283.766-1.764a6.971 6.971 0 01-.766-3.236c0-.386.016-.76.047-1.126.487-.219 1.203-.532 1.828-.532.623 0 1.343.313 1.828.532C7.735 6.26 7.75 6.635 7.75 7.02c0 .656-.31 1.283-.766 1.764.31.323.55.705.711 1.127a1.5 1.5 0 01-.638 2.852c-.19 0-.367-.064-.51-.174a6.971 6.971 0 01-3.257.938c-.386 0-.76-.016-1.126-.047-.219-.487-.532-1.203-.532-1.828 0-.623.313-1.343.532-1.828z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Booking Form */}
                {!isOwnListing && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Book this Chat</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        ${(listing.price / 100).toFixed(2)} for {listing.duration} minutes
                      </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      {success ? (
                        <div className="rounded-md bg-green-50 p-4 mb-4">
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
                      ) : (
                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                          {error && (
                            <div className="rounded-md bg-red-50 p-4">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700">
                              Date
                            </label>
                            <div className="mt-1">
                              <input
                                type="date"
                                name="booking-date"
                                id="booking-date"
                                required
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="booking-time" className="block text-sm font-medium text-gray-700">
                              Time
                            </label>
                            <div className="mt-1">
                              <input
                                type="time"
                                name="booking-time"
                                id="booking-time"
                                required
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="booking-message" className="block text-sm font-medium text-gray-700">
                              Message to Host (Optional)
                            </label>
                            <div className="mt-1">
                              <textarea
                                id="booking-message"
                                name="booking-message"
                                rows={3}
                                value={bookingMessage}
                                onChange={(e) => setBookingMessage(e.target.value)}
                                placeholder="Introduce yourself and share what you'd like to discuss"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              {isSubmitting ? 'Sending Request...' : 'Request Booking'}
                            </button>
                          </div>
                          
                          {!user && (
                            <div className="text-xs text-gray-500 text-center mt-2">
                              You'll need to sign in to complete your booking
                            </div>
                          )}
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}