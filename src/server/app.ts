import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';
import { authRouter } from './auth';
import { guildsRouter } from './routes/guilds';
import { playerRouter } from './routes/player';
import { searchRouter } from './routes/search';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      botOnline: true,
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/guilds', guildsRouter);
  app.use('/api/guilds', playerRouter);
  app.use('/api/search', searchRouter);

  // Serve static client bundle if built
  const clientDist = path.resolve(process.cwd(), 'dist/client');
  app.use(express.static(clientDist));

  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) {
        // If dist hasn't been built yet, show helpful setup guide
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Harmonix API Server</title></head>
            <body style="background:#0b0b14;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
              <h1 style="color:#1db954;">Harmonix Music Server Running</h1>
              <p>API and WebSocket Gateway are active on port ${config.port}.</p>
              <p>Run <code>npm run dev:client</code> to open Vite web dashboard during development, or run <code>npm run build:client</code>.</p>
            </body>
          </html>
        `);
      }
    });
  });

  return app;
}
