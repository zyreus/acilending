import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

function inPackage(id, pkg) {
  return id.includes(`/node_modules/${pkg}/`) || id.includes(`/node_modules/.pnpm/${pkg}@`)
}

function readLaravelActivePort() {
  try {
    const p = path.join(projectRoot, 'scripts', '.laravel-active-port')
    const v = fs.readFileSync(p, 'utf8').trim()
    if (/^\d+$/.test(v)) return v
  } catch {
    /* wait-laravel writes this after health check */
  }
  return null
}

// https://vite.dev/config/ — aligned with Amalgated Holdings (proxy + VITE_BACKEND_PORT for adminApi fallbacks)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fromWaitLocal = env.VITE_API_PROXY_TARGET || (env.VITE_BACKEND_PORT && `http://127.0.0.1:${env.VITE_BACKEND_PORT}`)
  const laravelPort =
    env.VITE_BACKEND_PORT ||
    readLaravelActivePort() ||
    env.LARAVEL_PORT ||
    '8000'
  const proxyTarget = (fromWaitLocal || `http://127.0.0.1:${laravelPort}`).replace(/\/$/, '')
  const portMatch = proxyTarget.match(/:(\d+)/)
  const apiPort = portMatch ? portMatch[1] : '8000'

  /** Node chat server (REST fallbacks only — Socket.IO uses VITE_CHAT_DEV_ORIGIN / 127.0.0.1:8010 directly in dev). */
  const chatTarget = (env.VITE_CHAT_PROXY_TARGET || 'http://127.0.0.1:8010').replace(/\/$/, '')

  const proxy = {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
      timeout: 120_000,
      proxyTimeout: 120_000,
    },
    /** Laravel `storage` symlink — Vite (5173) does not serve these; forward to PHP app. */
    '/storage': {
      target: proxyTarget,
      changeOrigin: true,
    },
    '/health': { target: proxyTarget, changeOrigin: true },
    /** Kept for any same-origin tooling; main app uses direct origin for Socket.IO to avoid WS proxy noise. */
    '/socket.io': { target: chatTarget, changeOrigin: true, ws: true },
  }

  return {
    root: __dirname,
    define: {
      'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(String(apiPort)),
    },
    plugins: [react(), tailwindcss()],
    server: { proxy },
    preview: { proxy },
    build: {
      /** One SPA output at repo root `dist/` (matches chat-server `../dist`, not `frontend/dist`). */
      outDir: path.resolve(projectRoot, 'dist'),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replaceAll('\\', '/')
            if (!normalizedId.includes('/node_modules/')) return

            if (
              normalizedId.includes('/node_modules/@mui/') ||
              normalizedId.includes('/node_modules/.pnpm/@mui+') ||
              normalizedId.includes('/node_modules/@emotion/') ||
              normalizedId.includes('/node_modules/.pnpm/@emotion+')
            ) {
              return 'mui-vendor'
            }

            if (
              inPackage(normalizedId, 'aws-amplify') ||
              normalizedId.includes('/node_modules/@aws-amplify/') ||
              normalizedId.includes('/node_modules/.pnpm/@aws-amplify+')
            ) {
              return 'amplify-vendor'
            }

            if (inPackage(normalizedId, 'recharts')) {
              return 'charts-vendor'
            }

            if (
              inPackage(normalizedId, 'framer-motion') ||
              inPackage(normalizedId, 'gsap')
            ) {
              return 'animation-vendor'
            }

            if (inPackage(normalizedId, 'socket.io-client')) {
              return 'realtime-vendor'
            }

            return 'vendor'
          },
        },
      },
      chunkSizeWarningLimit: 1500,
    },
  }
})
