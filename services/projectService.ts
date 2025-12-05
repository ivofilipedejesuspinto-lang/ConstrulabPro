
import { supabase } from './supabaseClient';
import { Project, ProjectData } from '../types';

export const ProjectService = {
  // Guardar novo projeto ou atualizar existente
  saveProject: async (userId: string, name: string, data: ProjectData, projectId?: string): Promise<Project> => {
    
    // Validar dados básicos
    if (!name || !userId) throw new Error("Dados inválidos para guardar.");

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
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  }
};
