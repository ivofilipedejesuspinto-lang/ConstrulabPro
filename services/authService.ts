
import { supabase, isConfigured } from './supabaseClient';
import { User, UserRole } from '../types';

// --- CONFIGURAÇÃO DE SUPER ADMIN ---
const MASTER_ADMIN_EMAIL = "seu_email_aqui@gmail.com"; 

// Converts Supabase DB 'profiles' row to our app 'User' type
const mapProfileToUser = (authData: any, profileData: any): User => {
  const isMaster = authData.email === MASTER_ADMIN_EMAIL;

  return {
    id: authData.id,
    email: authData.email || '',
    name: profileData?.name || authData.user_metadata?.name || 'Utilizador',
    role: isMaster ? 'admin' : (profileData?.role || 'free'), 
    subscriptionStatus: isMaster ? 'active' : (profileData?.subscription_status || 'inactive'),
    subscriptionExpiry: profileData?.subscription_expiry,
    createdAt: authData.created_at,
    companyName: profileData?.company_name,
    companyLogoUrl: profileData?.company_logo_url
  };
};

const getMockUser = (): User | null => {
    const cached = localStorage.getItem('calcconstrupro_user_cache');
    return cached ? JSON.parse(cached) : null;
};
const setMockUser = (user: User) => {
    localStorage.setItem('calcconstrupro_user_cache', JSON.stringify(user));
    localStorage.setItem('calcconstrupro_mock_session', 'true');
};

export const AuthService = {
  login: async (email: string, password: string): Promise<User> => {
    const isMaster = email === MASTER_ADMIN_EMAIL;
    if (!isConfigured) return AuthService.mockLogin(email, password, isMaster);

    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao obter dados do utilizador.");

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        const finalProfile = profileData || {};

        if (finalProfile.role === 'banned' && !isMaster) {
            await supabase.auth.signOut();
            throw new Error("Esta conta foi banida.");
        }

        if (finalProfile.subscription_status === 'trial' && finalProfile.subscription_expiry) {
            if (new Date(finalProfile.subscription_expiry) < new Date()) {
                 return mapProfileToUser(authData.user, { ...finalProfile, role: 'free', subscription_status: 'past_due' });
            }
        }

        return mapProfileToUser(authData.user, finalProfile);

    } catch (error: any) {
        if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("network"))) {
             return AuthService.mockLogin(email, password, isMaster);
        }
        throw error;
    }
  },

  mockLogin: async (email: string, password: string, isMaster: boolean): Promise<User> => {
        await new Promise(r => setTimeout(r, 600)); 
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

  register: async (email: string, password: string, name: string): Promise<User> => {
    if (!isConfigured) return AuthService.mockRegister(email, password, name, email === MASTER_ADMIN_EMAIL);

    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name } }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao criar conta.");

        return mapProfileToUser(authData.user, { name, role: 'free' });
    } catch (error: any) {
         if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("network"))) {
             return AuthService.mockRegister(email, password, name, email === MASTER_ADMIN_EMAIL);
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
    localStorage.removeItem('calcconstrupro_user_cache');
  },

  getCurrentUser: (): User | null => {
    const cached = localStorage.getItem('calcconstrupro_user_cache');
    return cached ? JSON.parse(cached) : null;
  },

  syncSession: async (): Promise<User | null> => {
    if (!isConfigured) {
        if (localStorage.getItem('calcconstrupro_mock_session')) return getMockUser();
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
            if (profile?.subscription_status === 'trial' && profile?.subscription_expiry) {
                 if (new Date(profile.subscription_expiry) < new Date()) {
                     finalProfile = { ...profile, role: 'free', subscription_status: 'past_due' };
                 }
            }

            const user = mapProfileToUser(data.session.user, finalProfile);
            localStorage.setItem('calcconstrupro_user_cache', JSON.stringify(user));
            return user;
        }
    } catch (e) {}
    return getMockUser();
  },

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

    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
    if (error) throw error;
  },

  // --- MOCK PAYMENT SIMULATION (ONLY FOR DEV/DEMO) ---
  simulatePaymentSuccess: async (userId: string): Promise<void> => {
    if (!isConfigured) {
        const user = getMockUser();
        if (user) {
            user.role = 'pro';
            user.subscriptionStatus = 'active';
            setMockUser(user);
        }
        return;
    }
    // Em produção real, isto seria feito via Webhook do Stripe no backend
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'pro', subscription_status: 'active', subscription_expiry: null })
      .eq('id', userId);
    if (error) throw error;
  },

  getAllUsers: async (): Promise<User[]> => {
    if (!isConfigured) {
        const current = getMockUser();
        return current ? [current] : [];
    }

    const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) return [];
    
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
        if (user && user.id === userId) { user.role = newRole; setMockUser(user); }
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
        if (user && user.id === userId) { user.name = updates.name; if(updates.companyName) user.companyName = updates.companyName; setMockUser(user); }
        return;
      }
      const { error } = await supabase.from('profiles').update({ name: updates.name, company_name: updates.companyName }).eq('id', userId);
      if (error) throw error;
  },

  deleteUser: async (userId: string): Promise<void> => {
    // --- MOCK MODE ---
    if (!isConfigured) {
        // Remover da cache local se for o utilizador atual
        const currentUser = getMockUser();
        if (currentUser && currentUser.id === userId) {
            localStorage.removeItem('calcconstrupro_user_cache');
            localStorage.removeItem('calcconstrupro_mock_session');
        }
        
        // Remover projetos do utilizador do mock storage
        const mockProjects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
        const filteredProjects = mockProjects.filter((p: any) => p.user_id !== userId);
        localStorage.setItem('mock_projects', JSON.stringify(filteredProjects));
        return; 
    }

    // --- SUPABASE MODE ---
    
    // 1. Apagar Projetos (Dados da Aplicação)
    // Mesmo que não haja "On Delete Cascade" no SQL, garantimos a limpeza aqui.
    const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', userId);
        
    if (projectError) {
         console.warn("Aviso ao apagar projetos (pode ser restrição FK ou RLS):", projectError);
    }

    // 2. Apagar Ficheiros do Storage (Logótipo da Empresa)
    try {
        const { data: files } = await supabase.storage.from('company-logos').list(userId);
        if (files && files.length > 0) {
            const filesToRemove = files.map(x => `${userId}/${x.name}`);
            await supabase.storage.from('company-logos').remove(filesToRemove);
        }
    } catch (e) {
        console.warn("Aviso ao limpar storage:", e);
    }

    // 3. Apagar o Perfil (Tabela Profiles)
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;

    // Nota: Em clientes JS (Frontend), não é possível apagar diretamente da tabela auth.users por segurança.
    // Mas ao apagar o perfil e os dados, o utilizador deixa de existir para a aplicação.
  },

  activateTrial: async (userId: string): Promise<void> => {
    if (!isConfigured) {
        const user = getMockUser();
        if (user) { user.role = 'pro'; user.subscriptionStatus = 'trial'; setMockUser(user); }
        return;
    }
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const { error } = await supabase.from('profiles').update({ role: 'pro', subscription_status: 'trial', subscription_expiry: nextWeek.toISOString() }).eq('id', userId);
    if (error) throw error;
  }
};
