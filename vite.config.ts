import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { codecovVitePlugin } from '@codecov/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: 'mycodexvantaos-vite',
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  resolve: {
    alias: {
      '@': '/src',
      '@mycodexvantaos': '/services',
    },
  },
});
