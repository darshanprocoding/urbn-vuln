import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    optimizeDeps: {
      include: ['maplibre-gl', '@deck.gl/react', '@deck.gl/layers', 'deck.gl'],
    },
    build: {
      chunkSizeWarningLimit: 1200,
      target: 'esnext',
      minify: 'esbuild' as const,
      cssCodeSplit: true,
      rollupOptions: {
        treeshake: {
          moduleSideEffects: true,
          propertyReadSideEffects: false,
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // React core & styling/animation
              if (
                id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/motion/') ||
                id.includes('node_modules/lucide-react/')
              ) {
                return 'vendor-core';
              }
              // Map rendering & WebGL layers
              if (
                id.includes('maplibre-gl') ||
                id.includes('react-map-gl') ||
                id.includes('deck.gl') ||
                id.includes('@deck.gl') ||
                id.includes('luma.gl') ||
                id.includes('@math.gl') ||
                id.includes('@loaders.gl') ||
                id.includes('@probe.gl')
              ) {
                return 'vendor-geo';
              }
              // Charts & data visualization
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
                return 'vendor-charts';
              }
              // PDF export & Canvas rasterization
              if (
                id.includes('jspdf') ||
                id.includes('html2canvas') ||
                id.includes('html2canvas-pro') ||
                id.includes('purify') ||
                id.includes('canvg')
              ) {
                return 'vendor-pdf';
              }
            }
          },
        },
      },
    },
  };
});

