-- Create feedback table
create table if not exists public.feedback (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete
    set null,
        type text not null check (type in ('bug', 'feature', 'general', 'other')),
        message text not null,
        status text not null default 'new' check (
            status in ('new', 'in_progress', 'resolved', 'closed')
        ),
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.feedback enable row level security;
-- Policies
-- Users can insert their own feedback (authenticated)
create policy "Users can insert their own feedback" on public.feedback for
insert to authenticated with check (true);
-- Users can view their own feedback
create policy "Users can view their own feedback" on public.feedback for
select to authenticated using (auth.uid() = user_id);
-- Grant access
grant all on public.feedback to authenticated;
grant all on public.feedback to service_role;