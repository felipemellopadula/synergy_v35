import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  subscription_type: 'free' | 'paid';
  tokens_remaining: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper: derive best possible name from OAuth metadata
  const deriveNameFromMetadata = (u?: User | null) => {
    const md: any = u?.user_metadata || {};
    const name = md.name || md.full_name || [md.given_name, md.family_name].filter(Boolean).join(' ');
    return name || 'Usuário';
  };

  // Helper: extract avatar URL from OAuth/Supabase metadata
  const extractAvatarFromUser = (u?: User | null): string | null => {
    if (!u) return null;
    const md: any = u.user_metadata || {};
    const identities: any[] = (u as any).identities || [];
    const facebook = identities.find((i: any) => i.provider === 'facebook');
    const google = identities.find((i: any) => i.provider === 'google');
    const fromIdentity =
      facebook?.identity_data?.avatar_url ||
      facebook?.identity_data?.picture ||
      google?.identity_data?.avatar_url ||
      google?.identity_data?.picture;
    return md.avatar_url || md.picture || fromIdentity || null;
  };

  const fetchProfile = async (userId: string, currentUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (!data) {
        // Create a default profile if it doesn't exist
        const defaultProfile = {
          id: userId,
          name: deriveNameFromMetadata(currentUser),
          email: currentUser?.email || '',
          subscription_type: 'paid' as const,
          tokens_remaining: 1000000,
          avatar_url: extractAvatarFromUser(currentUser),
          phone: (currentUser?.user_metadata?.phone as string) || null,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default profile:', insertError);
          return;
        }

        setProfile(inserted);
        return;
      }

      // Quick check for updates needed
      const desiredName = deriveNameFromMetadata(currentUser);
      const desiredAvatar = extractAvatarFromUser(currentUser);
      const needsNameUpdate = (!data.name || data.name === 'Usuário') && desiredName && desiredName !== data.name;
      const needsAvatarUpdate = (!data.avatar_url || data.avatar_url.length === 0) && desiredAvatar;

      if (needsNameUpdate || needsAvatarUpdate) {
        // Perform async update without blocking UI
        const updates: Partial<Profile> = {};
        if (needsNameUpdate) updates.name = desiredName;
        if (needsAvatarUpdate) updates.avatar_url = desiredAvatar;

        setProfile(data); // Set current data immediately
        
        // Update in background
        supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select('*')
          .single()
          .then(({ data: updated, error: updateError }) => {
            if (updateError) {
              console.error('Error updating profile:', updateError);
            } else if (updated) {
              setProfile(updated);
            }
          });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check for existing session first (faster)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id, session.user);
          
          // Redirect to dashboard after successful Google auth
          if (event === 'SIGNED_IN' && window.location.pathname === '/') {
            // Use navigate instead of window.location for faster navigation
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 100);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      // Redirect to dashboard after successful login
      window.location.href = '/dashboard';
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const normalizedEmail = email.trim().toLowerCase();
    
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          phone,
        }
      }
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });
    return { error };
  };


  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      await refreshProfile();
    }

    return { error };
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};