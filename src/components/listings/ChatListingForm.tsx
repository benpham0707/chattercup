import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type ChatListingFormProps = {
  userId: string;
  listingId?: string;
  onComplete?: () => void;
};

export default function ChatListingForm({ userId, listingId, onComplete }: ChatListingFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    price: 0,
    duration: 30,
    tags: [] as string[],
    is_active: true,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    async function fetchListing() {
      if (!listingId) return;
      
      try {
        const { data, error } = await supabase
          .from('chat_listings')
          .select('*')
          .eq('id', listingId)
          .single();

        if (error) throw error;
        
        if (data) {
          setListingData({
            title: data.title || '',
            description: data.description || '',
            price: data.price || 0,
            duration: data.duration || 30,
            tags: data.tags || [],
            is_active: data.is_active,
          });
        }
      } catch (error: any) {
        console.error('Error fetching listing:', error.message);
      }
    }

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setListingData({ ...listingData, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setListingData({ ...listingData, [name]: parseInt(value) || 0 });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setListingData({ ...listingData, [name]: checked });
  };

  const addTag = () => {
    if (tagInput.trim() && !listingData.tags.includes(tagInput.trim())) {
      setListingData({
        ...listingData,
        tags: [...listingData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setListingData({
      ...listingData,
      tags: listingData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const listingToSave = {
        ...listingData,
        host_id: userId,
        updated_at: new Date().toISOString(),
      };

      let response;
      
      if (listingId) {
        // Update existing listing
        response = await supabase
          .from('chat_listings')
          .update(listingToSave)
          .eq('id', listingId);
      } else {
        // Create new listing
        response = await supabase
          .from('chat_listings')
          .insert([{ ...listingToSave, created_at: new Date().toISOString() }]);
      }

      if (response.error) throw response.error;

      setMessage(listingId ? 'Listing updated successfully!' : 'Listing created successfully!');
      if (onComplete) onComplete();
    } catch (error: any) {
      setMessage(`Error ${listingId ? 'updating' : 'creating'} listing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={listingData.title}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., 'Career Advice in Software Engineering'"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={listingData.description}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe what you can offer in this chat session..."
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price (in cents)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="1"
              value={listingData.price}
              onChange={handleNumberChange}
              required
              className="mt-1 block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0"
              aria-describedby="price-currency"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm" id="price-currency">
                USD (in cents)
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Enter the amount in cents (e.g., 2000 for $20.00)
          </p>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration (minutes)
          </label>
          <select
            id="duration"
            name="duration"
            value={listingData.duration}
            onChange={(e) => setListingData({ ...listingData, duration: parseInt(e.target.value) })}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags
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
            {listingData.tags.map((tag, index) => (
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

        {/* Active Status */}
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={listingData.is_active}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="is_active" className="font-medium text-gray-700">
              Active Listing
            </label>
            <p className="text-gray-500">Make this listing visible to others</p>
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
          {loading ? 'Saving...' : listingId ? 'Update Listing' : 'Create Listing'}
        </button>
      </div>
    </form>
  );
}