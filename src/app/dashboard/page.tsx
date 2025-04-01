'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hostBookings, setHostBookings] = useState<any[]>([]);
  const [guestBookings, setGuestBookings] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          router.push('/auth/signin');
          return;
        }
        
        setUser(session.user);
        
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setProfile(profileData || null);
        
        // Fetch bookings where user is host
        const { data: hostData } = await supabase
          .from('bookings')
          .select(`
            *,
            guest:guest_id(id, full_name, profile_photo_url),
            listing:listing_id(id, title, price, duration)
          `)
          .eq('host_id', session.user.id)
          .order('scheduled_at', { ascending: true });
          
        setHostBookings(hostData || []);
        
        // Fetch bookings where user is guest
        const { data: guestData } = await supabase
          .from('bookings')
          .select(`
            *,
            host:host_id(id, full_name, profile_photo_url),
            listing:listing_id(id, title, price, duration)
          `)
          .eq('guest_id', session.user.id)
          .order('scheduled_at', { ascending: true });
          
        setGuestBookings(guestData || []);
        
        // Fetch user's listings
        const { data: listingsData } = await supabase
          .from('chat_listings')
          .select('*')
          .eq('host_id', session.user.id)
          .order('created_at', { ascending: false });
          
        setListings(listingsData || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Filter bookings based on active tab
  const filterBookings = (bookings: any[]) => {
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return bookings.filter(booking => 
        new Date(booking.scheduled_at) > now && 
        (booking.status === 'confirmed' || booking.status === 'pending')
      );
    } else if (activeTab === 'past') {
      return bookings.filter(booking => 
        new Date(booking.scheduled_at) < now || 
        booking.status === 'completed' || 
        booking.status === 'canceled'
      );
    }
    
    return bookings;
  };

  const filteredHostBookings = filterBookings(hostBookings);
  const filteredGuestBookings = filterBookings(guestBookings);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome section */}
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.full_name || user?.email}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your bookings and listings
          </p>
        </div>
        
        {/* Quick actions */}
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/marketplace"
              className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">Find Chats</h2>
                  <p className="text-sm text-gray-500">Browse the marketplace</p>
                </div>
              </div>
            </Link>
            
            <Link
              href="/listings/create"
              className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">Create Listing</h2>
                  <p className="text-sm text-gray-500">Offer your expertise</p>
                </div>
              </div>
            </Link>
            
            <Link
              href="/profile"
              className="bg-white overflow-hidden shadow rounded-lg p-6 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">Edit Profile</h2>
                  <p className="text-sm text-gray-500">Update your information</p>
                </div>
              </div>
            </Link>
            
            <div className="bg-white overflow-hidden shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">Your Bookings</h2>
                  <p className="text-sm text-gray-500">
                    {filteredHostBookings.length + filteredGuestBookings.length} upcoming
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="px-4 sm:px-6 lg:px-8 mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`${
                  activeTab === 'upcoming'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`${
                  activeTab === 'past'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Past
              </button>
            </nav>
          </div>
        </div>
        
        {/* Bookings where user is host */}
        {filteredHostBookings.length > 0 && (
          <div className="px-4 sm:px-6 lg:px-8 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Chats You're Hosting</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredHostBookings.map((booking) => {
                  const scheduledDate = new Date(booking.scheduled_at);
                  const isPast = scheduledDate < new Date();
                  
                  return (
                    <li key={booking.id}>
                      <Link href={`/bookings/${booking.id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                                {booking.guest?.profile_photo_url ? (
                                  <Image
                                    src={booking.guest.profile_photo_url}
                                    alt={booking.guest.full_name || 'Guest'}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-800 font-medium">
                                    {booking.guest?.full_name?.charAt(0) || 'G'}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-indigo-600 truncate">
                                  {booking.listing?.title || 'Chat Session'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  with {booking.guest?.full_name || 'Anonymous Guest'}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center">
                                <svg className="mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-500">
                                  {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
        
        {/* Bookings where user is guest */}
        {filteredGuestBookings.length > 0 && (
          <div className="px-4 sm:px-6 lg:px-8 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Chats You've Booked</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredGuestBookings.map((booking) => {
                  const scheduledDate = new Date(booking.scheduled_at);
                  const isPast = scheduledDate < new Date();
                  
                  return (
                    <li key={booking.id}>
                      <Link href={`/bookings/${booking.id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                                {booking.host?.profile_photo_url ? (
                                  <Image
                                    src={booking.host.profile_photo_url}
                                    alt={booking.host.full_name || 'Host'}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-800 font-medium">
                                    {booking.host?.full_name?.charAt(0) || 'H'}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-indigo-600 truncate">
                                  {booking.listing?.title || 'Chat Session'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  with {booking.host?.full_name || 'Anonymous Host'}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center">
                                <svg className="mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-500">
                                  {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
        
        {/* User's listings */}
        {listings.length > 0 && (
          <div className="px-4 sm:px-6 lg:px-8 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Your Listings</h2>
              <Link
                href="/listings/create"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Listing
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{listing.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {listing.duration} minutes • ${(listing.price / 100).toFixed(2)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1">
                      {listing.tags && listing.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View listing
                    </Link>
                    <Link
                      href={`/listings/edit/${listing.id}`}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty states */}
        {filteredHostBookings.length === 0 && filteredGuestBookings.length === 0 && listings.length === 0 && (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings or listings yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a listing or booking a chat.</p>
              <div className="mt-6 flex justify-center space-x-4">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Browse Marketplace
                </Link>
                <Link
                  href="/listings/create"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create a Listing
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}