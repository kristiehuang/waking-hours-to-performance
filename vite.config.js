import { defineConfig } from "vite";

export default defineConfig({
  // Set base URL for GitHub Pages deployment
  // Update this to match your repository name
  base: process.env.NODE_ENV === 'production' ? '/felix-trading-day-to-waking-hours/' : '/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});