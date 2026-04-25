import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Works well for GitHub Pages project sites without knowing repo name up-front.
  // If you later want an absolute base (e.g. '/flash-cards/'), set it here.
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});

