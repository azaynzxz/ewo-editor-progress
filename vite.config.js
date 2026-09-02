import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5189,
      proxy: {
        '/api/exec': {
          target: new URL(env.APPS_SCRIPT_URL).origin,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            const scriptUrl = new URL(env.APPS_SCRIPT_URL);
            const reqUrl = new URL(path, 'http://localhost');
            return scriptUrl.pathname + reqUrl.search;
          }
        }
      }
    }
  }
})
