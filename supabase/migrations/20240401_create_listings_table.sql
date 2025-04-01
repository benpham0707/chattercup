-- Create listings table
create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  price numeric not null,
  duration integer not null,
  format text not null default 'virtual', -- 'virtual' or 'in-person' or 'both'
  location text, -- for in-person meetings
  meeting_link text, -- for virtual meetings
  availability text[], -- array of available time slots
  topics text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.listings enable row level security;

-- Create policies
create policy "Users can view all listings" 
  on public.listings for select 
  using (true);

create policy "Users can create their own listings" 
  on public.listings for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own listings" 
  on public.listings for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own listings" 
  on public.listings for delete 
  using (auth.uid() = user_id);