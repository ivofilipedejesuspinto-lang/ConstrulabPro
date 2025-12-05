
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for security/size
    minify: 'esbuild',
    rollupOptions: {
        output: {
            manualChunks: {
                vendor: ['react', 'react-dom', 'lucide-react'],
                supabase: ['@supabase/supabase-js']
            }
        }
    }
  },
  server: {
    port: 3000,
  }
});
