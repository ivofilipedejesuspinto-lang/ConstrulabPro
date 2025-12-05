
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';

// Converts Supabase DB 'profiles' row to our app 'User' type
const mapProfileToUser = (authData: any, profileData: any): User => {
  return {
    id: authData.id,
    email: authData.email || '',
    name: profileData?.name || authData.user_metadata?.name || 'Utilizador',
    role: profileData?.role || 'free',
    subscriptionStatus: profileData?.subscription_status || 'inactive',
    subscriptionExpiry: profileData?.subscription_expiry,
    createdAt: authData.created_at
  };
};

export const AuthService = {
  // Login standard
  login: async (email: string, password: string): Promise<User> => {
    // 1. Authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Erro ao obter dados do utilizador.");

    // 2. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    // If trigger failed for some reason, we catch it here, but we don't try to hack fix it anymore.
    if (profileError) {
        console.error("Profile fetch error:", profileError);
        // Fallback minimal user if profile is missing (rare if trigger works)
        return mapProfileToUser(authData.user, {}); 
    }

    if (profileData && profileData.role === 'banned') {
        await supabase.auth.signOut();
        throw new Error("Esta conta foi banida.");
    }

    return mapProfileToUser(authData.user, profileData);
  },

  // Register standard
  register: async (email: string, password: string, name: string): Promise<User> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Erro ao criar conta.");

    // The Trigger in Supabase handles the profile creation.
    // We just map the initial data.
    return mapProfileToUser(authData.user, { name, role: 'free' });
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('construlab_session');
    localStorage.removeItem('construlab_user_cache');
  },

  // Get Current Session (On App Load)
  getCurrentUser: (): User | null => {
    const cached = localStorage.getItem('construlab_user_cache');
    return cached ? JSON.parse(cached) : null;
  },

  // Sync Session
  syncSession: async (): Promise<User | null> => {
    const { data } = await supabase.auth.getSession();
    
    if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (profile && profile.role === 'banned') {
            await supabase.auth.signOut();
            localStorage.removeItem('construlab_user_cache');
            return null;
        }

        const user = mapProfileToUser(data.session.user, profile || {});
        localStorage.setItem('construlab_user_cache', JSON.stringify(user));
        return user;
    }
    return null;
  },

  // ADMIN FUNCTIONS
  getAllUsers: async (): Promise<User[]> => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
        console.warn("Error fetching users:", error);
        return []; 
    }
    
    return profiles.map((p: any) => ({
      id: p.id,
      email: p.email || '', 
      name: p.name,
      role: p.role as UserRole,
      subscriptionStatus: p.role === 'banned' ? 'banned' : p.subscription_status,
      subscriptionExpiry: p.subscription_expiry,
      createdAt: p.created_at || new Date().toISOString()
    }));
  },

  updateUserRole: async (userId: string, newRole: UserRole): Promise<void> => {
    const updateData: any = { role: newRole };
    
    if (newRole === 'free') {
        updateData.subscription_status = 'inactive';
    } else if (newRole === 'pro' || newRole === 'admin') {
        updateData.subscription_status = 'active';
    } else if (newRole === 'banned') {
        updateData.subscription_status = 'banned';
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  },

  deleteUser: async (userId: string): Promise<void> => {
    // This will cascade delete projects due to DB config
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
    
    if (error) throw error;
  },

  simulatePaymentSuccess: async (userId: string): Promise<void> => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'pro',
        subscription_status: 'active',
        subscription_expiry: nextYear.toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }
};
