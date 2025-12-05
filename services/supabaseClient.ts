import { createClient } from '@supabase/supabase-js';

// NOTA: Para DEPLOY, deve configurar estas variáveis no painel do seu alojamento (Netlify/Vercel).
// Não as escreva diretamente aqui para produção.

// Fix: Safely access env to prevent crash if import.meta.env is undefined
const env = (import.meta as any).env || {};

const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';

// Flag para saber se estamos conectados ao backend real ou em modo demonstração
export const isConfigured = !!(SUPABASE_URL && SUPABASE_URL !== 'https://placeholder.supabase.co' && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'placeholder');

if (!isConfigured) {
    console.warn("⚠️ MODO DEMO ATIVO: Credenciais Supabase não detetadas. A usar Mock Service (apenas local).");
}

// Prevent createClient from crashing with empty strings
const validUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const validKey = SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(validUrl, validKey);