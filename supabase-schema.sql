-- ============================================
-- Smart Meeting Scheduler — Supabase SQL Schema
-- Run this in the Supabase SQL Editor
-- ============================================
-- STEP 1: Create ALL tables first (order matters for foreign keys)
-- STEP 2: Enable RLS on all tables
-- STEP 3: Add all policies (after all tables exist)
-- STEP 4: Create functions & triggers
-- ============================================

-- ========================
-- STEP 1: CREATE ALL TABLES
-- ========================

-- 1. Users table (synced from auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  created_at timestamptz default now()
);

-- 2. Groups table
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  slot_duration integer default 30 check (slot_duration in (30, 60, 90, 120)),
  availability_deadline timestamptz,
  join_code text unique,
  created_by uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 3. Group members table
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

-- 4. Invites table
create table public.invites (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  email text not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  invited_by uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (group_id, email)
);

-- 5. Availability table
create table public.availability (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  day text not null,
  timeslot text not null,
  created_at timestamptz default now(),
  unique (user_id, group_id, day, timeslot)
);

-- 6. Meetings table
create table public.meetings (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  scheduled_day text not null,
  scheduled_time text not null,
  created_by uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 7. Notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text check (type in ('invite', 'meeting_scheduled', 'availability_updated')) not null,
  message text not null,
  read boolean default false,
  group_id uuid references public.groups(id) on delete cascade,
  created_at timestamptz default now()
);

-- 8. Contacts table (saved email contacts per user)
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  email text not null,
  created_at timestamptz default now(),
  unique (user_id, email)
);

-- 9. Messages table (direct messages between contacts)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ========================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- ========================

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.invites enable row level security;
alter table public.availability enable row level security;
alter table public.meetings enable row level security;
alter table public.notifications enable row level security;
alter table public.contacts enable row level security;

alter table public.messages enable row level security;

-- ========================
-- STEP 3: ADD ALL POLICIES
-- ========================

-- Users policies
create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own data" on public.users
  for insert with check (auth.uid() = id);

-- NOTE: "Users can read group members" policy uses helper function (defined in STEP 4)
-- It's created after the functions are defined below

-- Groups policies
create policy "Users can read groups they belong to" on public.groups
  for select using (
    id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "Group creators can read own groups" on public.groups
  for select using (auth.uid() = created_by);

create policy "Invited users can read group info" on public.groups
  for select using (
    id in (
      select group_id from public.invites
      where email = (select email from public.users where id = auth.uid())
        and status = 'pending'
    )
  );

create policy "Authenticated users can read groups by join code" on public.groups
  for select using (join_code is not null);

create policy "Authenticated users can create groups" on public.groups
  for insert with check (auth.uid() = created_by);

create policy "Group admins can update groups" on public.groups
  for update using (
    id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Group admins can delete groups" on public.groups
  for delete using (auth.uid() = created_by);

-- Group members policies are created AFTER helper functions (see STEP 4)

-- Invites policies
create policy "Users can read invites for their email" on public.invites
  for select using (
    email = (select email from public.users where id = auth.uid())
    or invited_by = auth.uid()
    or group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Group admins can create invites" on public.invites
  for insert with check (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can update their own invites" on public.invites
  for update using (
    email = (select email from public.users where id = auth.uid())
  );

-- Availability policies
create policy "Users can read availability in their groups" on public.availability
  for select using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "Users can insert their own availability" on public.availability
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own availability" on public.availability
  for update using (auth.uid() = user_id);

create policy "Users can delete their own availability" on public.availability
  for delete using (auth.uid() = user_id);

-- Meetings policies
create policy "Users can read meetings in their groups" on public.meetings
  for select using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "Group admins can create meetings" on public.meetings
  for insert with check (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Group admins can update meetings" on public.meetings
  for update using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Group admins can delete meetings" on public.meetings
  for delete using (
    group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Notifications policies
create policy "Users can read own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "Authenticated users can create notifications" on public.notifications
  for insert with check (true);

-- ========================
-- STEP 4: FUNCTIONS, TRIGGERS & DEFERRED POLICIES
-- ========================

-- Contacts policies (simple, no recursion)
create policy "Users can read own contacts" on public.contacts
  for select using (auth.uid() = user_id);

create policy "Users can insert own contacts" on public.contacts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own contacts" on public.contacts
  for update using (auth.uid() = user_id);

create policy "Users can delete own contacts" on public.contacts
  for delete using (auth.uid() = user_id);

-- Messages policies
create policy "Users can read own messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "Users can update own received messages" on public.messages
  for update using (auth.uid() = receiver_id);

-- Helper functions to avoid infinite recursion in RLS policies
create or replace function public.is_member_of_group(gid uuid)
returns boolean
language sql
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function public.is_admin_of_group(gid uuid)
returns boolean
language sql
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid() and role = 'admin'
  );
$$;

-- Deferred group_members policies (using helper functions)
create policy "Users can read members of their groups" on public.group_members
  for select using (public.is_member_of_group(group_id));

create policy "Group admins can add members" on public.group_members
  for insert with check (
    public.is_admin_of_group(group_id) or user_id = auth.uid()
  );

create policy "Group admins can remove members" on public.group_members
  for delete using (
    public.is_admin_of_group(group_id) or user_id = auth.uid()
  );

-- Deferred users policy (uses group_members via helper)
create policy "Users can read group members" on public.users
  for select using (
    id in (
      select gm.user_id from public.group_members gm
      where public.is_member_of_group(gm.group_id)
    )
  );

-- Users policy for contacts (read contact profiles)
create policy "Users can read their contacts" on public.users
  for select using (
    email in (
      select c.email from public.contacts c where c.user_id = auth.uid()
    )
  );

-- RPC: Create group and add creator as admin (bypasses RLS)
create or replace function public.create_group_with_admin(
  group_name text,
  group_description text default null,
  group_slot_duration integer default 30,
  group_availability_deadline timestamptz default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_group_id uuid := gen_random_uuid();
  current_user_id uuid := auth.uid();
begin
  insert into public.groups (id, name, description, slot_duration, availability_deadline, created_by)
  values (new_group_id, group_name, group_description, group_slot_duration, group_availability_deadline, current_user_id);

  insert into public.group_members (group_id, user_id, role)
  values (new_group_id, current_user_id, 'admin');

  return new_group_id;
end;
$$;

-- Handle new user signup (auto-create profile)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-accept pending invites when a user signs up
create or replace function public.handle_pending_invites()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  invite_record record;
begin
  for invite_record in
    select * from public.invites
    where email = new.email and status = 'pending'
  loop
    insert into public.group_members (group_id, user_id, role)
    values (invite_record.group_id, new.id, 'member')
    on conflict do nothing;

    update public.invites
    set status = 'accepted'
    where id = invite_record.id;

    insert into public.notifications (user_id, type, message, group_id)
    values (
      new.id,
      'invite',
      'You were added to a group',
      invite_record.group_id
    );
  end loop;

  return new;
end;
$$;

create or replace trigger on_user_created_check_invites
  after insert on public.users
  for each row execute procedure public.handle_pending_invites();

-- RPC: Get pending invites with group name & inviter details (bypasses RLS)
create or replace function public.get_pending_invites()
returns table (
  invite_id uuid,
  group_id uuid,
  group_name text,
  inviter_name text,
  inviter_email text,
  created_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
declare
  user_email text;
begin
  select u.email into user_email from public.users u where u.id = auth.uid();

  return query
    select
      i.id as invite_id,
      i.group_id,
      g.name as group_name,
      u.full_name as inviter_name,
      u.email as inviter_email,
      i.created_at
    from public.invites i
    join public.groups g on g.id = i.group_id
    join public.users u on u.id = i.invited_by
    where i.email = user_email and i.status = 'pending'
    order by i.created_at desc;
end;
$$;

-- RPC: Generate a unique join code for a group (admin only)
create or replace function public.generate_join_code(target_group_id uuid)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  new_code text;
  is_admin boolean;
begin
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id and user_id = auth.uid() and role = 'admin'
  ) into is_admin;

  if not is_admin then
    raise exception 'Only group admins can generate join codes';
  end if;

  -- Generate a 6-char alphanumeric code
  new_code := upper(substr(md5(random()::text || now()::text), 1, 6));

  update public.groups set join_code = new_code where id = target_group_id;

  return new_code;
end;
$$;

-- RPC: Join a group via passcode
create or replace function public.join_group_by_code(code text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  target_group_id uuid;
  current_user_id uuid := auth.uid();
begin
  select id into target_group_id from public.groups where join_code = upper(trim(code));

  if target_group_id is null then
    raise exception 'Invalid join code';
  end if;

  -- Check if already a member
  if exists (select 1 from public.group_members where group_id = target_group_id and user_id = current_user_id) then
    raise exception 'You are already a member of this group';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, current_user_id, 'member');

  return target_group_id;
end;
$$;

-- ========================
-- HABIT TRACKER TABLES
-- ========================

-- 10. Habits table
create table if not exists public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  color text default '#22c55e',
  icon text default '🎯',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 11. Habit Entries (daily check-ins)
create table if not exists public.habit_entries (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references public.habits(id) on delete cascade not null,
  date date not null,
  completed boolean default false,
  unique(habit_id, date)
);

-- 12. Mood Entries (daily mood/energy/motivation)
create table if not exists public.mood_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  mood int check (mood >= 1 and mood <= 10) default 5,
  energy int check (energy >= 1 and energy <= 10) default 5,
  motivation int check (motivation >= 1 and motivation <= 10) default 5,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- RLS for habit tables
alter table public.habits enable row level security;
alter table public.habit_entries enable row level security;
alter table public.mood_entries enable row level security;

-- Habits policies: users can only manage their own habits
create policy "Users can view own habits"
  on public.habits for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own habits"
  on public.habits for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own habits"
  on public.habits for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own habits"
  on public.habits for delete to authenticated
  using (user_id = auth.uid());

-- Habit entries policies: users manage entries for their own habits
create policy "Users can view own habit entries"
  on public.habit_entries for select to authenticated
  using (habit_id in (select id from public.habits where user_id = auth.uid()));

create policy "Users can insert own habit entries"
  on public.habit_entries for insert to authenticated
  with check (habit_id in (select id from public.habits where user_id = auth.uid()));

create policy "Users can update own habit entries"
  on public.habit_entries for update to authenticated
  using (habit_id in (select id from public.habits where user_id = auth.uid()));

create policy "Users can delete own habit entries"
  on public.habit_entries for delete to authenticated
  using (habit_id in (select id from public.habits where user_id = auth.uid()));

-- Mood entries policies: users manage their own mood entries
create policy "Users can view own mood entries"
  on public.mood_entries for select to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own mood entries"
  on public.mood_entries for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own mood entries"
  on public.mood_entries for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own mood entries"
  on public.mood_entries for delete to authenticated
  using (user_id = auth.uid());

-- ========================
-- VIDEO CALL LINK + GROUP CHAT + PROFILE
-- ========================

-- Add bio to users table
alter table public.users add column if not exists bio text;

-- Add meet_link to groups table (admin sets it)
alter table public.groups add column if not exists meet_link text;

-- Add meet_link to meetings table
alter table public.meetings add column if not exists meet_link text;

-- 13. Group Messages table (group chat)
create table if not exists public.group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  created_at timestamptz default now()
);

alter table public.group_messages enable row level security;

-- Group messages policies: members can read & send messages in their groups
create policy "Members can read group messages"
  on public.group_messages for select to authenticated
  using (public.is_member_of_group(group_id));

create policy "Members can send group messages"
  on public.group_messages for insert to authenticated
  with check (public.is_member_of_group(group_id) and user_id = auth.uid());

create policy "Users can delete own group messages"
  on public.group_messages for delete to authenticated
  using (user_id = auth.uid());

-- Enable realtime for group_messages
alter publication supabase_realtime add table public.group_messages;
