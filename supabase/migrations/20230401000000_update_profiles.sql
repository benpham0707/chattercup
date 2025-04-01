-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'guest';

-- Add specific profile fields requested by user
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_coffee_shops TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS topics TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- Update the existing offers_chats column to be based on user_type
CREATE OR REPLACE FUNCTION update_offers_chats() RETURNS TRIGGER AS $$
BEGIN
  NEW.offers_chats = (NEW.user_type = 'host');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_offers_chats
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_offers_chats();

-- Add a policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);