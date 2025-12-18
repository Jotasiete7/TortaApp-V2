import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Profile } from '../services/supabase';
import { User } from '@supabase/supabase-js';
import { open } from '@tauri-apps/plugin-shell';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

interface AuthContextType {
    user: User | null;
    role: 'guest' | 'user' | 'admin' | 'moderator';
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'guest' | 'user' | 'admin' | 'moderator'>('guest');
    const [loading, setLoading] = useState(true);

    // Fetch user role from profiles table
    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching role:', error);
                // If no profile exists, create one with 'user' role
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({ id: userId, role: 'user' });

                if (!insertError) {
                    setRole('user');
                }
                return;
            }

            setRole(data?.role || 'user');
        } catch (err) {
            console.error('Unexpected error fetching role:', err);
        }
    };

    // Initialize auth state
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Get initial session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (mounted) {
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await fetchUserRole(session.user.id);
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                // Even on error, we must stop loading to show the login screen
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        const setupDeepLink = async () => {
            try {
                // @ts-ignore - plugin might not display ts types correctly in some environments
                await onOpenUrl(async (urls) => {
                    console.log('Deep link received:', urls);
                    for (const url of urls) {
                         // Check if it's our auth callback
                         if (url.includes('access_token') || url.includes('refresh_token')) {
                              const fragment = url.split('#')[1];
                              if (fragment) {
                                   const params = new URLSearchParams(fragment);
                                   const access_token = params.get('access_token');
                                   const refresh_token = params.get('refresh_token');
                                   
                                   if (access_token && refresh_token) {
                                        const { error } = await supabase.auth.setSession({
                                             access_token,
                                             refresh_token
                                        });
                                        if (error) console.error('Error setting session from deep link:', error);
                                   }
                              }
                         }
                    }
               });
            } catch (err) {
                // Ignore errors if plugin is not available (e.g. browser mode)
                console.log('Deep link listener skipped/failed (expected in browser)');
            }
        };

        initAuth();
        setupDeepLink();

        // Safety timeout: If auth takes too long (> 3s), force loading false
        const timeoutId = setTimeout(() => {
            if (loading && mounted) {
                console.warn('Auth initialization timed out, forcing app load.');
                setLoading(false);
            }
        }, 3000);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchUserRole(session.user.id);
                } else {
                    setRole('guest');
                }
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    // Realtime role updates
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('profile-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    const newRole = (payload.new as Profile).role;
                    setRole(newRole);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signInWithGoogle = async () => {
        // Check if running in Tauri (using internals check or window check)
        // @ts-ignore
        const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

        if (isTauri) {
             const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: 'torta-app://z-auth-callback',
                    skipBrowserRedirect: true
                }
            });
            if (error) throw error;
            if (data?.url) {
                 await open(data.url);
            }
        } else {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/v1/callback`
                }
            });
            if (error) throw error;
        }
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, signIn, signInWithGoogle, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
