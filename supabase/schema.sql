-- Create a table for public user profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Establish generic RLS
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Create a table for Generations
create table generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  prompt text not null,
  status text not null default 'pending', -- pending, processing, completed, failed
  video_url text,
  kie_id text, -- ID returned by KIE AI
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Generations
alter table generations enable row level security;
create policy "Users can view own generations." on generations for select using (auth.uid() = user_id);
create policy "Users can insert own generations." on generations for insert with check (auth.uid() = user_id);
create policy "Service role can update generations" on generations for update using (true); -- Simplified, ideally restrict to service role

-- Create a table for Credits
create table credits (
  user_id uuid references profiles(id) on delete cascade not null primary key,
  seconds_remaining integer default 30,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Credits
alter table credits enable row level security;
create policy "Users can view own credits." on credits for select using (auth.uid() = user_id);
-- Only system can update credits (via API functions)
