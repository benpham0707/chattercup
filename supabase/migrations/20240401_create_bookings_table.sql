-- Create bookings table
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings not null,
  user_id uuid references auth.users not null,
  host_id uuid references auth.users not null,
  status text not null default 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  date date not null,
  time text not null,
  format text not null, -- 'virtual' or 'in-person'
  location text, -- for in-person meetings
  meeting_link text, -- for virtual meetings
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.bookings enable row level security;

-- Create policies
create policy "Users can view their own bookings" 
  on public.bookings for select 
  using (auth.uid() = user_id OR auth.uid() = host_id);

create policy "Users can create bookings" 
  on public.bookings for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own bookings" 
  on public.bookings for update 
  using (auth.uid() = user_id OR auth.uid() = host_id);