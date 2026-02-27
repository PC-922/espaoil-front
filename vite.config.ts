import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const clientTracePlugin = () => {
  return {
    name: 'client-trace-to-terminal',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.method !== 'POST' || req.url !== '/__client-log') {
          next();
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer | string) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            const timestamp = payload.timestamp || new Date().toISOString();
            const level = (payload.level || 'info').toUpperCase();
            const source = payload.source || 'client';
            const message = payload.message || 'sin mensaje';

            const header = `[CLIENT ${level}] ${timestamp} ${source} - ${message}`;

            if (payload.level === 'error') {
              console.error(header);
              if (payload.details) {
                console.error(payload.details);
              }
            } else if (payload.level === 'warn') {
              console.warn(header);
              if (payload.details) {
                console.warn(payload.details);
              }
            } else {
              console.log(header);
              if (payload.details) {
                console.log(payload.details);
              }
            }
          } catch (error) {
            console.error('[CLIENT TRACE] Payload inválido:', error);
          }

          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
  const appVersion = process.env.npm_package_version || '0.0.0';
  const commitShaRaw = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || process.env.COMMIT_SHA || 'local';
  const commitSha = commitShaRaw === 'local' ? 'local' : commitShaRaw.slice(0, 7);
  const buildDate = new Date().toISOString();
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'https://espaoil-server.onrender.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path: string) => path.replace(/^\/api/, ''),
          },
        },
      },
      plugins: [react(), clientTracePlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        __APP_VERSION__: JSON.stringify(appVersion),
        __APP_COMMIT_SHA__: JSON.stringify(commitSha),
        __APP_BUILD_DATE__: JSON.stringify(buildDate),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        coverage: {
          provider: 'v8',
          reporter: ['text', 'html'],
          thresholds: {
            lines: 70,
            functions: 70,
            branches: 70,
            statements: 70,
          },
        },
      },
    };
});
