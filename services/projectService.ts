
import { supabase, isConfigured } from './supabaseClient';
import { Project, ProjectData } from '../types';

export const ProjectService = {
  // Guardar novo projeto ou atualizar existente
  saveProject: async (userId: string, name: string, data: ProjectData, projectId?: string): Promise<Project> => {
    
    // Validar dados básicos
    if (!name || !userId) throw new Error("Dados inválidos para guardar.");

    // --- MOCK MODE ---
    if (!isConfigured) {
        await new Promise(r => setTimeout(r, 400));
        const mockProjects: Project[] = JSON.parse(localStorage.getItem('mock_projects') || '[]');
        
        let savedProject: Project;
        if (projectId) {
            const idx = mockProjects.findIndex(p => p.id === projectId);
            if (idx === -1) throw new Error("Projeto não encontrado");
            savedProject = { ...mockProjects[idx], name, data, updated_at: new Date().toISOString() };
            mockProjects[idx] = savedProject;
        } else {
            savedProject = {
                id: 'mock-proj-' + Date.now(),
                user_id: userId,
                name,
                data,
                created_at: new Date().toISOString()
            } as any; // updated_at optional in Project interface? Adjusting types helps, simplified here.
            mockProjects.push(savedProject);
        }
        localStorage.setItem('mock_projects', JSON.stringify(mockProjects));
        return savedProject;
    }

    const payload = {
      user_id: userId,
      name: name,
      data: data,
      updated_at: new Date().toISOString()
    };

    let result;

    if (projectId) {
      // Update
      result = await supabase
        .from('projects')
        .update(payload)
        .eq('id', projectId)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return result.data as Project;
  },

  // Obter todos os projetos do utilizador
  getUserProjects: async (userId: string): Promise<Project[]> => {
    if (!isConfigured) {
        await new Promise(r => setTimeout(r, 300));
        const mockProjects: Project[] = JSON.parse(localStorage.getItem('mock_projects') || '[]');
        return mockProjects.filter(p => p.user_id === userId);
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as Project[];
  },

  // Apagar projeto
  deleteProject: async (projectId: string): Promise<void> => {
    if (!isConfigured) {
        const mockProjects: Project[] = JSON.parse(localStorage.getItem('mock_projects') || '[]');
        const filtered = mockProjects.filter(p => p.id !== projectId);
        localStorage.setItem('mock_projects', JSON.stringify(filtered));
        return;
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }
};
