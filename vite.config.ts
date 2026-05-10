// @ts-nocheck
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Nested deps pull in different copies of `quill`; ReactQuill and Quill.register
    // must share the same instance.
    dedupe: ['quill'],
  },
  // Pre-bundle Quill stack so dev uses one graph; avoids flaky requests after installs.
  optimizeDeps: {
    include: ['quill', 'react-quill-new', 'lodash', 'quill-image-resize-module-react'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
