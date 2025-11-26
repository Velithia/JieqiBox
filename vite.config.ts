import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/onnxruntime-web/dist/*.wasm', dest: 'ort' },
        { src: 'node_modules/onnxruntime-web/dist/*.mjs', dest: 'ort' },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Include audio files as assets
  assetsInclude: ['**/*.wav'],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri` and autosave files
      ignored: [
        '**/src-tauri/**',
        '**/Autosave.json',
        '**/config.ini',
        '**/jieqi_openings.jb',
      ],
    },
  },
}))
