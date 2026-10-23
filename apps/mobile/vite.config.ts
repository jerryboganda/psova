import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // The hosted build sets VITE_BASE=/app/ (served by the website from public/app).
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: { port: 1420, strictPort: true },
  build: { target: 'safari15' },
});
