import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';

/**
 * `npm run dev` serves /api/keeper with the same handler Vercel runs, so the keeper can talk
 * locally too (set GEMINI_API_KEY in your shell or .env.local; without it she uses her built-in answers).
 */
function keeperApi(): Plugin {
  return {
    name: 'keeper-api',
    configureServer(server) {
      server.middlewares.use('/api/keeper', async (req, res) => {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body: unknown = {};
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          /* empty body */
        }
        const mod = await server.ssrLoadModule('/api/keeper.ts');
        res.setHeader('Content-Type', 'application/json');
        await mod.default(
          { method: req.method, body },
          {
            setHeader: (k: string, v: string) => res.setHeader(k, v),
            status: (n: number) => ({
              json: (b: unknown) => {
                res.statusCode = n;
                res.end(JSON.stringify(b));
              },
              end: () => {
                res.statusCode = n;
                res.end();
              },
            }),
          },
        );
      });
    },
  };
}

export default defineConfig(() => {
  return {
    // relative asset paths: the same build works on Vercel and inside itch.io's iframe
    base: './',
    plugins: [react(), tailwindcss(), keeperApi()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // three.js in its own file: cached separately, so updates to the temple stay small
          manualChunks: (id: string) => (id.includes('node_modules/three') ? 'three' : undefined),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
