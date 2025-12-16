import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync } from 'fs'

// Read version from config file
function getAppVersion(): string {
  try {
    const versionFile = readFileSync(path.resolve(__dirname, './src/config/version.ts'), 'utf-8')
    const match = versionFile.match(/export const APP_VERSION = ['"](.+?)['"]/)
    return match ? match[1] : '1.0.0'
  } catch {
    return '1.0.0'
  }
}

// Plugin to inject version into HTML
function htmlVersionPlugin(): Plugin {
  const version = getAppVersion()
  return {
    name: 'html-version-plugin',
    transformIndexHtml(html: string) {
      // Replace {{APP_VERSION}} placeholder with actual version
      return html.replace(/\{\{APP_VERSION\}\}/g, version)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    htmlVersionPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Make version available in code as well
    'import.meta.env.APP_VERSION': JSON.stringify(getAppVersion()),
  },
  server: {
    port: 3001,
    // Proxy to Cloudflare Pages Functions in production, or local backend in dev
    proxy: process.env.NODE_ENV === 'production' ? undefined : {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
