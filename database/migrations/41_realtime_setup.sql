-- Enable Realtime for player_stats table
-- This allows the frontend to listen for UPDATE events when XP changes
begin;
-- Check if publication exists, if not create it (standard supabase setup usually has it)
-- We'll just try to add the table. If it fails, user might need to do it in UI, but this often works.
alter publication supabase_realtime
add table public.player_stats;
-- Also add user_profiles if that's where some data lives, but player_stats has the XP usually.
-- alter publication supabase_realtime add table public.player_profiles; 
commit;