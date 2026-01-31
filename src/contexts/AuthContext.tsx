import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'mentor' | 'student';

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url?: string;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    isMentor: boolean;
    isStudent: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEY = 'upsc_mentor_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const safetyTimeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        const initializeAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    await fetchProfile(currentSession.user.id);
                } else {

                    // No session = no profile
                    localStorage.removeItem(CACHE_KEY);
                    setProfile(null);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Auth Init Error:', err);
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('Auth Event:', event);

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                setLoading(true);
            }

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.user) {
                await fetchProfile(newSession.user.id);
            } else {
                localStorage.removeItem(CACHE_KEY);
                setProfile(null);
                setLoading(false);
            }
        });


        return () => {
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };

    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                const newProfile = data as UserProfile;
                setProfile(newProfile);
                localStorage.setItem(CACHE_KEY, JSON.stringify(newProfile));
            }
        } catch (error: any) {
            console.warn('Profile fetch handled (background):', error.message);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        // 1. Clear local state IMMEDIATELY
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);

        // 2. Aggressively clear ALL Supabase tokens from localStorage
        // This prevents "zombie" sessions if the network request fails
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key === CACHE_KEY) {
                localStorage.removeItem(key);
            }
        });

        try {
            // 3. Attempt network sign out
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Supabase SignOut Error:', error);
        }
    };



    const value = {
        user,
        profile,
        session,
        loading,
        isAdmin: profile?.role === 'admin',
        isMentor: profile?.role === 'mentor',
        isStudent: profile?.role === 'student' || !profile?.role,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

