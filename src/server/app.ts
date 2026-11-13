import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import FileStoreFactory from 'session-file-store';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';
import { authRouter } from './auth';
import { guildsRouter } from './routes/guilds';
import { playerRouter } from './routes/player';
import { searchRouter } from './routes/search';

const FileStore = FileStoreFactory(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp() {
  const app = express();

  // 1. Trust proxy for reverse proxy deployment (Nginx / GCP Cloud Load Balancing)
  app.set('trust proxy', 1);

  // 2. Security HTTP Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows CDN images (Discord avatars, YouTube thumbnails, Google Fonts)
      crossOriginEmbedderPolicy: false,
    })
  );

  // 3. CORS Configuration
  app.use(
    cors({
      origin: config.isProduction ? config.dashboardUrl : true,
      credentials: true,
    })
  );

  // 4. Rate Limiting to prevent API abuse and scraping
  const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
  });

  const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 45,
    message: { error: 'Search rate limit exceeded. Please wait a moment.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: { error: 'Too many authentication attempts. Please try again later.' },
  });

  app.use('/api', generalApiLimiter);
  app.use('/api/search', searchLimiter);
  app.use('/api/auth/discord', authLimiter);
  app.use('/api/auth/dev-login', authLimiter);

  // 5. Body Parsing & Cookies
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // 6. Session Configuration with Persistent FileStore
  app.use(
    session({
      store: new FileStore({
        path: path.resolve(process.cwd(), '.sessions'),
        ttl: 7 * 24 * 60 * 60, // 7 days
        retries: 2,
        logFn: () => {}, // Suppress verbose internal store logs
      }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.isProduction, // Requires HTTPS in production
        httpOnly: true, // Prevents XSS cookie access
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // 7. Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      botOnline: true,
      env: config.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  // 8. API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/guilds', guildsRouter);
  app.use('/api/guilds', playerRouter);
  app.use('/api/search', searchRouter);

  // 9. Static client bundle serving
  const clientDist = path.resolve(process.cwd(), 'dist/client');
  app.use(express.static(clientDist));

  // SPA fallback
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Harmonix API Server</title></head>
            <body style="background:#0b0b14;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
              <h1 style="color:#1db954;">Harmonix Music Server Running</h1>
              <p>API and WebSocket Gateway are active on port ${config.port}.</p>
              <p>Run <code>npm run build:client</code> to bundle frontend.</p>
            </body>
          </html>
        `);
      }
    });
  });

  return app;
}
