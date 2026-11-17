import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev only: serves the Vercel-style functions in /api through `npm run dev`, so
// the app and its API work together without the Vercel CLI. On Vercel itself
// the same files are served by Vercel (this plugin is skipped in `vite build`).
function devApi() {
  return {
    name: 'dev-api',
    apply: 'serve',
    configResolved(config) {
      // Server-only variables (no VITE_ prefix, so they never reach the browser).
      // Add more prefixes here if a function needs other server-side variables.
      Object.assign(process.env, loadEnv(config.mode, config.root, ['NOTION_']))
    },
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const name = req.url.split('?')[0].replace(/^\/+|\/+$/g, '')
        const file = path.join(server.config.root, 'api', `${name}.js`)
        if (!/^[\w-]+$/.test(name) || !fs.existsSync(file)) return next()

        const send = (code, body) => {
          res.statusCode = code
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }
        // Same helpers the Vercel runtime adds to the response.
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (body) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); return res }

        try {
          const chunks = []
          for await (const c of req) chunks.push(c)
          const raw = Buffer.concat(chunks).toString('utf8')
          req.body = raw && (req.headers['content-type'] || '').includes('application/json')
            ? JSON.parse(raw)
            : raw || undefined
          const mod = await server.ssrLoadModule(`/api/${name}.js`)
          await mod.default(req, res)
        } catch (e) {
          if (e instanceof SyntaxError) return send(400, { error: 'invalid_body' })
          console.error(`[dev-api] /api/${name} failed:`, e)
          send(500, { error: 'server_error' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApi()],
})
