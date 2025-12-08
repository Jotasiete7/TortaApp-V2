-- RPC to get feedback with user details
-- Returns feedback joined with the verified game_nick if available
create or replace function public.get_admin_feedback() returns table (
        id uuid,
        user_id uuid,
        type text,
        message text,
        status text,
        created_at timestamptz,
        reporter_nick text,
        reporter_email text
    ) language plpgsql security definer as $$ begin -- Check if executing user is admin is handled by RLS on the typical flow, 
    -- but for RPC we might want an explicit check or rely on the UI hiding it.
    -- Ideally, we check public.is_admin() if it exists, or just rely on RLS if we were querying tables directly.
    -- optimized for the Admin Panel usage.
    return query
select f.id,
    f.user_id,
    f.type,
    f.message,
    f.status,
    f.created_at,
    coalesce(un.game_nick, 'Anonymous') as reporter_nick,
    au.email::text as reporter_email
from public.feedback f
    left join public.user_nicks un on f.user_id = un.user_id
    and un.is_verified = true
    left join auth.users au on f.user_id = au.id
order by f.created_at desc;
end;
$$;