'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function CreateListing() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Update the initial state with proper typing
  const [listing, setListing] = useState<{
    title: string;
    description: string;
    price: string;
    duration: number;
    format: 'virtual' | 'in-person' | 'both';
    location: string;
    meeting_link: string;
    topics: string[];
    availability: string[];
  }>({
    title: '',
    description: '',
    price: '',
    duration: 30,
    format: 'virtual', // 'virtual', 'in-person', or 'both'
    location: '',
    meeting_link: '',
    topics: [],
    availability: []
  });
  const [topicInput, setTopicInput] = useState('');
  const [availabilityInput, setAvailabilityInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Validate form
      if (!listing.title.trim()) {
        throw new Error('Title is required');
      }
      
      if (!listing.description.trim()) {
        throw new Error('Description is required');
      }
      
      if (!listing.price || isNaN(parseFloat(listing.price)) || parseFloat(listing.price) < 0) {
        throw new Error('Please enter a valid price');
      }
      
      // Only validate location for in-person format
      if ((listing.format === 'in-person' || listing.format === 'both') && !listing.location.trim()) {
        throw new Error('Location is required for in-person meetings');
      }
      
      // Only validate meeting link for virtual format
      if ((listing.format === 'virtual' || listing.format === 'both') && !listing.meeting_link.trim()) {
        throw new Error('Meeting link is required for virtual meetings');
      }
      
      if (listing.topics.length === 0) {
        throw new Error('Please add at least one topic');
      }
      
      if (listing.availability.length === 0) {
        throw new Error('Please add at least one availability slot');
      }
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/signin');
        return;
      }
      
      // Prepare the data object
      const listingData = {
        user_id: session.user.id,
        title: listing.title.trim(),
        description: listing.description.trim(),
        price: parseFloat(listing.price),
        duration: listing.duration,
        format: listing.format,
        location: listing.location.trim() || null,
        meeting_link: listing.meeting_link.trim() || null,
        topics: listing.topics,
        availability: listing.availability
      };
      
      console.log('Sending to Supabase:', JSON.stringify(listingData, null, 2));
      
      try {
        // Use a simpler insert without select
        const { error: insertError } = await supabase
          .from('listings')
          .insert(listingData);
          
        if (insertError) {
          console.error('Insert error:', insertError);
          
          // Check if the error is about the table not existing
          if (insertError.message && insertError.message.includes('relation "public.listings" does not exist')) {
            throw new Error(
              'The listings table does not exist in your database yet. ' +
              'You need to apply the migration from supabase/migrations/20240401_create_listings_table.sql. ' +
              'Run "npx supabase migration up" or apply the migration through the Supabase dashboard.'
            );
          }
          
          throw new Error(insertError.message || 'Failed to create listing');
        }
        
        console.log('Listing created successfully');
        
        // Redirect to dashboard
        router.push('/dashboard');
      } catch (insertErr: any) {
        console.error('Insert operation error:', insertErr);
        throw new Error(insertErr.message || 'Error during insert operation');
      }
      
    } catch (error: any) {
      console.error('Error creating listing:', error);
      setError(error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const addTopic = () => {
    if (topicInput.trim() && !listing.topics.includes(topicInput.trim())) {
      setListing({
        ...listing,
        topics: [...listing.topics, topicInput.trim()]
      });
      setTopicInput('');
    }
  };

  const removeTopic = (topic: string) => {
    setListing({
      ...listing,
      topics: listing.topics.filter(t => t !== topic)
    });
  };

  const addAvailability = () => {
    if (availabilityInput.trim() && !listing.availability.includes(availabilityInput.trim())) {
      setListing({
        ...listing,
        availability: [...listing.availability, availabilityInput.trim()]
      });
      setAvailabilityInput('');
    }
  };

  const removeAvailability = (time: string) => {
    setListing({
      ...listing,
      availability: listing.availability.filter(t => t !== time)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900">Create a Listing</h1>
          <p className="mt-1 text-sm text-gray-600">
            Share your expertise and offer coffee chats
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
                  <p className="text-sm font-medium text-red-800">Error creating listing: {error}</p>
                  <p className="text-sm text-red-700 mt-1">Please check the console for more details.</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Listing Details</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Provide details about your coffee chat offering
                </p>
              </div>
              
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Title */}
                  <div className="sm:col-span-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={listing.title}
                        onChange={(e) => setListing({ ...listing, title: e.target.value })}
                        placeholder="e.g. Career Advice for Software Engineers"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={listing.description}
                        onChange={(e) => setListing({ ...listing, description: e.target.value })}
                        placeholder="Describe what you can offer in this coffee chat"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="sm:col-span-3">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Price ($)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        name="price"
                        id="price"
                        min="0"
                        step="0.01"
                        value={listing.price}
                        onChange={(e) => setListing({ ...listing, price: e.target.value })}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md text-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="sm:col-span-3">
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Duration (minutes)
                    </label>
                    <div className="mt-1">
                      <select
                        id="duration"
                        name="duration"
                        value={listing.duration}
                        onChange={(e) => setListing({ ...listing, duration: parseInt(e.target.value) })}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                      </select>
                    </div>
                  </div>

                  {/* Format */}
                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Meeting Format</label>
                    <div className="mt-2">
                      <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                        <div className="flex items-center">
                          <input
                            id="format-virtual"
                            name="format"
                            type="radio"
                            checked={listing.format === 'virtual'}
                            onChange={() => setListing({ ...listing, format: 'virtual' })}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                          />
                          <label htmlFor="format-virtual" className="ml-3 block text-sm font-medium text-gray-700">
                            Virtual
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="format-in-person"
                            name="format"
                            type="radio"
                            checked={listing.format === 'in-person'}
                            onChange={() => setListing({ ...listing, format: 'in-person' })}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                          />
                          <label htmlFor="format-in-person" className="ml-3 block text-sm font-medium text-gray-700">
                            In-Person
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="format-both"
                            name="format"
                            type="radio"
                            checked={listing.format === 'both'}
                            onChange={() => setListing({ ...listing, format: 'both' })}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                          />
                          <label htmlFor="format-both" className="ml-3 block text-sm font-medium text-gray-700">
                            Both
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location (for in-person) */}
                  {(listing.format === 'in-person' || listing.format === 'both') && (
                    <div className="sm:col-span-6">
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="location"
                          id="location"
                          value={listing.location}
                          onChange={(e) => setListing({ ...listing, location: e.target.value })}
                          placeholder="e.g. Starbucks on Main St, or 'Various locations in San Francisco'"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* Meeting Link (for virtual) */}
                  {(listing.format === 'virtual' || listing.format === 'both') && (
                    <div className="sm:col-span-6">
                      <label htmlFor="meeting-link" className="block text-sm font-medium text-gray-700">
                        Meeting Link or Instructions
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="meeting-link"
                          id="meeting-link"
                          value={listing.meeting_link}
                          onChange={(e) => setListing({ ...listing, meeting_link: e.target.value })}
                          placeholder="e.g. Zoom link or 'Will send Zoom link after booking'"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  <div className="sm:col-span-6">
                    <label htmlFor="topics" className="block text-sm font-medium text-gray-700">
                      Topics
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="topics"
                        id="topics"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTopic();
                          }
                        }}
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
                    {/* In the Topics section */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {listing.topics.map((topic, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {topic}
                            <button
                              type="button"
                              onClick={() => removeTopic(topic)}
                              className="ml-1.5 inline-flex text-blue-400 hover:text-blue-500"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    
                    {/* In the Availability section */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {listing.availability.map((time, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {time}
                            <button
                              type="button"
                              onClick={() => removeAvailability(time)}
                              className="ml-1.5 inline-flex text-blue-400 hover:text-blue-500"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                  </div>

                  {/* Availability */}
                  <div className="sm:col-span-6">
                    <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                      Availability
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="availability"
                        id="availability"
                        value={availabilityInput}
                        onChange={(e) => setAvailabilityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addAvailability();
                          }
                        }}
                        placeholder="Add availability and press Enter"
                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={addAvailability}
                        className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {listing.availability.map((time, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {time}
                          <button
                            type="button"
                            onClick={() => removeAvailability(time)}
                            className="ml-1.5 inline-flex text-blue-400 hover:text-blue-500"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? 'Creating...' : 'Create Listing'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}