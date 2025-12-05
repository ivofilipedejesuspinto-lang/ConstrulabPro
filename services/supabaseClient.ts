
import { createClient } from '@supabase/supabase-js';

// INSTRUCTIONS:
// 1. Go to https://supabase.com and create a new project.
// 2. Go to Project Settings > API.
// 3. Copy "Project URL" and "anon public" Key.
// 4. Replace the placeholders below.

const SUPABASE_URL = 'https://xdzngtwyfdinjdiantny.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkem5ndHd5ZmRpbmpkaWFudG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODM2NzUsImV4cCI6MjA4MDQ1OTY3NX0.LKztn8mxbwrD6uqTO7UAAGPCgd6bv0KFwQSOC4VUwww';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
