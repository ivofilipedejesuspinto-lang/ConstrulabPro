
import { supabase, isConfigured } from './supabaseClient';
import { User, UserRole } from '../types';

// --- CONFIGURAÇÃO DE SUPER ADMIN ---
// SUBSTITUA ISTO PELO SEU EMAIL REAL PARA TER ACESSO ADMIN IMEDIATO
const MASTER_ADMIN_EMAIL = "seu_email_aqui@gmail.com"; 

// Converts Supabase DB 'profiles' row to our app 'User' type
const mapProfileToUser = (authData: any, profileData: any): User => {
  // Se o email for o do Mestre, força ADMIN, ignorando a DB
  const isMaster = authData.email === MASTER_ADMIN_EMAIL;

  return {
    id: authData.id,
    email: authData.email || '',
    name: profileData?.name || authData.user_metadata?.name || 'Utilizador',
    role: isMaster ? 'admin' : (profileData?.role || 'free'), // Force Admin
    subscriptionStatus: isMaster ? 'active' : (profileData?.subscription_status || 'inactive'),
    subscriptionExpiry: profileData?.subscription_expiry,
    createdAt: authData.created_at,
    companyName: profileData?.company_name,
    companyLogoUrl: profileData?.company_logo_url
  };
};

// --- MOCK UTILS FOR DEMO MODE ---
const getMockUser = (): User | null => {
    // Rebranded key
    const cached = localStorage.getItem('calcconstrupro_user_cache');
    return cached ? JSON.parse(cached) : null;
};
const setMockUser = (user: User) => {
    // Rebranded key
    localStorage.setItem('calcconstrupro_user_cache', JSON.stringify(user));
    localStorage.setItem('calcconstrupro_mock_session', 'true');
};

export const AuthService = {
  // Login standard
  login: async (email: string, password: string): Promise<User> => {
    // Check Master Admin in Mock Mode too
    const isMaster = email === MASTER_ADMIN_EMAIL;

    if (!isConfigured) {
        return AuthService.mockLogin(email, password, isMaster);
    }

    try {
        // 1. Authenticate (REAL DB)
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
        
        // Fallback if profile missing but auth passed
        const finalProfile = profileData || {};

        if (finalProfile.role === 'banned' && !isMaster) {
            await supabase.auth.signOut();
            throw new Error("Esta conta foi banida.");
        }

        // Check trial expiry
        if (finalProfile.subscription_status === 'trial' && finalProfile.subscription_expiry) {
            if (new Date(finalProfile.subscription_expiry) < new Date()) {
                 // Expired
                 return mapProfileToUser(authData.user, { ...finalProfile, role: 'free', subscription_status: 'past_due' });
            }
        }

        return mapProfileToUser(authData.user, finalProfile);

    } catch (error: any) {
        console.error("Login error:", error);
        // Fallback to mock if network fails (Failed to fetch)
        if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("network"))) {
             console.warn("Network error detected. Falling back to Mock Mode.");
             return AuthService.mockLogin(email, password, isMaster);
        }
        throw error;
    }
  },

  mockLogin: async (email: string, password: string, isMaster: boolean): Promise<User> => {
        await new Promise(r => setTimeout(r, 600)); // Fake network delay
        
        let role: UserRole = 'free';
        if (isMaster || email.includes('admin')) role = 'admin';
        else if (email.includes('pro')) role = 'pro';

        const mockUser: User = {
            id: 'mock-user-' + Date.now(),
            email,
            name: email.split('@')[0],
            role,
            subscriptionStatus: role !== 'free' ? 'active' : 'inactive',
            createdAt: new Date().toISOString()
        };
        setMockUser(mockUser);
        return mockUser;
  },

  // Register standard
  register: async (email: string, password: string, name: string): Promise<User> => {
    const isMaster = email === MASTER_ADMIN_EMAIL;

    if (!isConfigured) {
        return AuthService.mockRegister(email, password, name, isMaster);
    }

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao criar conta.");

        return mapProfileToUser(authData.user, { name, role: 'free' });
    } catch (error: any) {
         if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("network"))) {
             return AuthService.mockRegister(email, password, name, isMaster);
        }
        throw error;
    }
  },

  mockRegister: async (email: string, password: string, name: string, isMaster: boolean): Promise<User> => {
        await new Promise(r => setTimeout(r, 600));
        const mockUser: User = {
            id: 'mock-user-' + Date.now(),
            email,
            name,
            role: isMaster ? 'admin' : 'free',
            subscriptionStatus: isMaster ? 'active' : 'inactive',
            createdAt: new Date().toISOString()
        };
        setMockUser(mockUser);
        return mockUser;
  },

  logout: async () => {
    if (!isConfigured) {
        localStorage.removeItem('calcconstrupro_mock_session');
        localStorage.removeItem('calcconstrupro_user_cache');
        return;
    }
    await supabase.auth.signOut();
    localStorage.removeItem('calcconstrupro_session'); // Legacy
    localStorage.removeItem('calcconstrupro_user_cache');
  },

  // Get Current Session (On App Load)
  getCurrentUser: (): User | null => {
    const cached = localStorage.getItem('calcconstrupro_user_cache');
    return cached ? JSON.parse(cached) : null;
  },

  // Sync Session
  syncSession: async (): Promise<User | null> => {
    if (!isConfigured) {
        if (localStorage.getItem('calcconstrupro_mock_session')) {
            return getMockUser();
        }
        return null;
    }

    try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();

            const isMaster = data.session.user.email === MASTER_ADMIN_EMAIL;

            if (profile && profile.role === 'banned' && !isMaster) {
                await supabase.auth.signOut();
                localStorage.removeItem('calcconstrupro_user_cache');
                return null;
            }

            let finalProfile = profile || {};
            // Check expiry
            if (profile?.subscription_status === 'trial' && profile?.subscription_expiry) {
                 if (new Date(profile.subscription_expiry) < new Date()) {
                     finalProfile = { ...profile, role: 'free', subscription_status: 'past_due' };
                 }
            }

            const user = mapProfileToUser(data.session.user, finalProfile);
            localStorage.setItem('calcconstrupro_user_cache', JSON.stringify(user));
            return user;
        }
    } catch (e) {
        console.warn("Session sync failed, using cached if available", e);
    }
    return getMockUser(); // Fallback to local cache if sync fails
  },

  // --- WHITE LABEL FEATURES ---
  
  uploadLogo: async (userId: string, file: File): Promise<string> => {
    if (!isConfigured) {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            resolve(url);
        });
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('company-logos')
      .getPublicUrl(filePath);

    return `${data.publicUrl}?t=${Date.now()}`;
  },

  updateCompanyProfile: async (userId: string, companyName: string, logoUrl?: string) => {
    if (!isConfigured) {
        const user = getMockUser();
        if (user) {
            user.companyName = companyName;
            if (logoUrl) user.companyLogoUrl = logoUrl;
            setMockUser(user);
        }
        return;
    }

    const updateData: any = { company_name: companyName };
    if (logoUrl) updateData.company_logo_url = logoUrl;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  },

  // --- STRIPE / PAYMENT INTEGRATION ---
  
  // 1. Crie uma Supabase Edge Function: `supabase functions new create-checkout`
  // 2. Coloque lá a sua Stripe Secret Key
  // 3. Esta função abaixo chamará o seu backend seguro
  startStripeCheckout: async (priceId: string) => {
      if (!isConfigured) {
          throw new Error("Modo Demo: Pagamentos reais não disponíveis.");
      }

      // EXEMPLO DE IMPLEMENTAÇÃO FUTURA:
      /*
      const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { priceId }
      });
      
      if (error) throw error;
      if (data?.url) {
          window.location.href = data.url; // Redireciona para o Stripe
      }
      */
     
      // Por agora, lançamos erro para usar a simulação no Modal
      throw new Error("Integração Stripe pendente. A usar simulação.");
  },

  simulatePaymentSuccess: async (userId: string): Promise<void> => {
    // ATENÇÃO: Em produção, isto deve ser removido ou protegido.
    // O estado 'active' deve ser definido via Webhook do Stripe (backend), não pelo frontend.
    
    if (!isConfigured) {
        const user = getMockUser();
        if (user) {
            user.role = 'pro';
            user.subscriptionStatus = 'active';
            setMockUser(user);
        }
        return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'pro',
        subscription_status: 'active',
        subscription_expiry: null 
      })
      .eq('id', userId);

    if (error) throw error;
  },

  // --- ADMIN FUNCTIONS ---
  getAllUsers: async (): Promise<User[]> => {
    if (!isConfigured) {
        const current = getMockUser();
        return current ? [current, {
            id: 'mock-other',
            email: 'cliente@exemplo.com',
            name: 'Cliente Teste',
            role: 'free',
            subscriptionStatus: 'inactive',
            createdAt: new Date().toISOString()
        } as User] : [];
    }

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
      role: (p.email === MASTER_ADMIN_EMAIL) ? 'admin' : p.role as UserRole,
      subscriptionStatus: p.role === 'banned' ? 'banned' : p.subscription_status,
      subscriptionExpiry: p.subscription_expiry,
      createdAt: p.created_at || new Date().toISOString(),
      companyName: p.company_name, 
      companyLogoUrl: p.company_logo_url
    }));
  },

  updateUserRole: async (userId: string, newRole: UserRole): Promise<void> => {
    if (!isConfigured) {
        const user = getMockUser();
        if (user && user.id === userId) {
            user.role = newRole;
            setMockUser(user);
        }
        return;
    }

    const updateData: any = { role: newRole };
    
    if (newRole === 'free') updateData.subscription_status = 'inactive';
    else if (newRole === 'pro' || newRole === 'admin') updateData.subscription_status = 'active';
    else if (newRole === 'banned') updateData.subscription_status = 'banned';

    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
    if (error) throw error;
  },

  adminUpdateUserProfile: async (userId: string, updates: { name: string, companyName?: string }): Promise<void> => {
      if (!isConfigured) {
        const user = getMockUser();
        if (user && user.id === userId) {
            user.name = updates.name;
            if(updates.companyName) user.companyName = updates.companyName;
            setMockUser(user);
        }
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
            name: updates.name,
            company_name: updates.companyName
        })
        .eq('id', userId);

      if (error) throw error;
  },

  deleteUser: async (userId: string): Promise<void> => {
    if (!isConfigured) return; 
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  },

  activateTrial: async (userId: string): Promise<void> => {
    if (!isConfigured) {
        const user = getMockUser();
        if (user) {
            user.role = 'pro';
            user.subscriptionStatus = 'trial';
            setMockUser(user);
        }
        return;
    }

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { error } = await supabase
      .from('profiles')
      .update({
        role: 'pro',
        subscription_status: 'trial',
        subscription_expiry: nextWeek.toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }
};
