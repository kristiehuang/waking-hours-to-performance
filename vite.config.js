import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Set base URL for GitHub Pages deployment
  // Update this to match your repository name
  base: process.env.NODE_ENV === 'production' ? '/waking-hours-to-performance/' : '/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});