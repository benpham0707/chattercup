'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function BookingDetail() {
  const [booking, setBooking] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [host, setHost] = useState<any>(null);
  const [guest, setGuest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  useEffect(() => {
    async function fetchBooking() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        // Fetch booking details
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;
        setBooking(bookingData);

        // Check if user is authorized to view this booking
        if (session?.user && 
            bookingData.guest_id !== session.user.id && 
            bookingData.host_id !== session.user.id) {
          router.push('/dashboard');
          return;
        }

        // Fetch listing details
        if (bookingData.listing_id) {
          const { data: listingData, error: listingError } = await supabase
            .from('chat_listings')
            .select('*')
            .eq('id', bookingData.listing_id)
            .single();

          if (!listingError) {
            setListing(listingData);
          }
        }

        // Fetch host details
        if (bookingData.host_id) {
          const { data: hostData, error: hostError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', bookingData.host_id)
            .single();

          if (!hostError) {
            setHost(hostData);
          }
        }

        // Fetch guest details
        if (bookingData.guest_id) {
          const { data: guestData, error: guestError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', bookingData.guest_id)
            .single();

          if (!guestError) {
            setGuest(guestData);
          }
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    }

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId, router]);

  const updateBookingStatus = async (status: 'confirmed' | 'canceled') => {
    if (!user || !booking) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check if user is authorized to update this booking
      if (status === 'confirmed' && user.id !== booking.host_id) {
        throw new Error('Only the host can confirm bookings');
      }
      
      if (status === 'canceled') {
        if (user.id !== booking.host_id && user.id !== booking.guest_id) {
          throw new Error('Only the host or guest can cancel bookings');
        }
      }
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);
        
      if (error) throw error;
      
      // Update local state
      setBooking({
        ...booking,
        status,
        updated_at: new Date().toISOString(),
      });
      
      setSuccess(status === 'confirmed' 
        ? 'Booking confirmed successfully!' 
        : 'Booking canceled successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to update booking status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isHost = user && user.id === booking.host_id;
  const isGuest = user && user.id === booking.guest_id;
  const scheduledDate = new Date(booking.scheduled_at);
  const isPast = scheduledDate < new Date();
  const statusColor = 
    booking.status === 'confirmed' ? 'green' :
    booking.status === 'pending' ? 'yellow' :
    booking.status === 'completed' ? 'blue' : 'gray';

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Booking header */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                    Booking Details
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {listing?.title || 'Chat Session'}
                  </p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Success/Error messages */}
            {success && (
              <div className="rounded-md bg-green-50 p-4 mb-6">
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

            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Booking Details */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Information</h3>
                  </div>
                  <div className="border-t border-gray-200">
                    <dl>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Date and Time</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </dd>
                      </div>
                      <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Duration</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {booking.duration} minutes
                        </dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Price</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          ${(booking.price / 100).toFixed(2)}
                        </dd>
                      </div>
                      {booking.message && (
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Message</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                            {booking.message}
                          </dd>
                        </div>
                      )}
                      {booking.meeting_link && (
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Meeting Link</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <a 
                              href={booking.meeting_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-500"
                            >
                              {booking.meeting_link}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Listing Details */}
                {listing && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Chat Details</h3>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{listing.title}</h4>
                      <p className="text-gray-600 text-sm mb-4 whitespace-pre-line">{listing.description}</p>
                      
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1">
                          {listing.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <Link
                        href={`/listings/${listing.id}`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        View full listing
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Host/Guest Info */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {isHost ? 'Guest Information' : 'Host Information'}
                    </h3>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="flex items-center">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                        {isHost ? (
                          guest?.profile_photo_url ? (
                            <Image
                              src={guest.profile_photo_url}
                              alt={guest.full_name || 'Guest'}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-800 font-medium text-xl">
                              {guest?.full_name?.charAt(0) || 'G'}
                            </div>
                          )
                        ) : (
                          host?.profile_photo_url ? (
                            <Image
                              src={host.profile_photo_url}
                              alt={host.full_name || 'Host'}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-800 font-medium text-xl">
                              {host?.full_name?.charAt(0) || 'H'}
                            </div>
                          )
                        )}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          {isHost ? guest?.full_name || 'Anonymous Guest' : host?.full_name || 'Anonymous Host'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {isHost ? guest?.headline || 'Guest' : host?.headline || 'Expert'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Actions</h3>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    {/* Host actions */}
                    {isHost && booking.status === 'pending' && (
                      <div className="space-y-3">
                        <button
                          onClick={() => updateBookingStatus('confirmed')}
                          disabled={isUpdating}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isUpdating ? 'Processing...' : 'Confirm Booking'}
                        </button>
                        <button
                          onClick={() => updateBookingStatus('canceled')}
                          disabled={isUpdating}
                          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isUpdating ? 'Processing...' : 'Decline Booking'}
                        </button>
                      </div>
                    )}
                    
                    {/* Host actions for confirmed bookings */}
                    {isHost && booking.status === 'confirmed' && !isPast && (
                      <div className="space-y-3">
                        {!booking.meeting_link && (
                          <Link
                            href={`/bookings/${booking.id}/update`}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Add Meeting Link
                          </Link>
                        )}
                        <button
                          onClick={() => updateBookingStatus('canceled')}
                          disabled={isUpdating}
                          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isUpdating ? 'Processing...' : 'Cancel Booking'}
                        </button>
                      </div>
                    )}
                    
                    {/* Guest actions */}
                    {isGuest && (booking.status === 'pending' || booking.status === 'confirmed') && !isPast && (
                      <div className="space-y-3">
                        <button
                          onClick={() => updateBookingStatus('canceled')}
                          disabled={isUpdating}
                          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isUpdating ? 'Processing...' : 'Cancel Booking'}
                        </button>
                      </div>
                    )}
                    
                    {/* Completed or canceled booking */}
                    {(booking.status === 'completed' || booking.status === 'canceled') && (
                      <div className="text-center text-sm text-gray-500">
                        {booking.status === 'completed' 
                          ? 'This booking has been completed.' 
                          : 'This booking has been canceled.'}
                      </div>
                    )}
                    
                    {/* Join meeting button */}
                    {booking.status === 'confirmed' && booking.meeting_link && !isPast && (
                      <div className="mt-3">
                        <a
                          href={booking.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Back to Dashboard */}
                <div className="text-center">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    <svg className="-ml-1 mr-1 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}