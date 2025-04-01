-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  role TEXT,
  bio TEXT,
  industry TEXT,
  company TEXT,
  tags TEXT[],
  favorite_coffee_shop TEXT,
  profile_photo_url TEXT,
  offers_chats BOOLEAN DEFAULT FALSE,
  requests_chats BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_listings table
CREATE TABLE chat_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in cents
  duration INTEGER NOT NULL, -- in minutes
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create availability table for time slots
CREATE TABLE availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES chat_listings(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES chat_listings(id) ON DELETE SET NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  availability_id UUID REFERENCES availability(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled')) DEFAULT 'pending',
  payment_intent_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'refunded', 'failed')) DEFAULT 'pending',
  video_chat_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connections table
CREATE TABLE connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user1_status TEXT CHECK (user1_status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  user2_status TEXT CHECK (user2_status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Chat listings policies
CREATE POLICY "Chat listings are viewable by everyone" ON chat_listings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own chat listings" ON chat_listings
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update their own chat listings" ON chat_listings
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Users can delete their own chat listings" ON chat_listings
  FOR DELETE USING (auth.uid() = host_id);

-- Availability policies
CREATE POLICY "Availability is viewable by everyone" ON availability
  FOR SELECT USING (true);

CREATE POLICY "Hosts can manage their availability" ON availability
  FOR ALL USING (
    auth.uid() IN (
      SELECT host_id FROM chat_listings WHERE id = availability.listing_id
    )
  );

-- Bookings policies
CREATE POLICY "Users can view bookings they're part of" ON bookings
  FOR SELECT USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "Guests can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Users can update bookings they're part of" ON bookings
  FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Connections policies
CREATE POLICY "Users can view their own connections" ON connections
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create connection requests" ON connections
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own connection status" ON connections
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);