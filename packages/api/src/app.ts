import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import restaurantRouter from './routes/restaurants';
import customerRouter from './routes/customer.routes';
import paymentsRouter from './routes/payments.routes';

const app = express();

// ─── Global Middleware ───────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // In development or server-to-server/testing (no origin), allow
      if (env.NODE_ENV !== 'production' || !origin) {
        callback(null, true);
        return;
      }
      const allowed = env.CORS_ORIGIN.replace(/\/$/, '');
      const incoming = origin.replace(/\/$/, '');
      if (incoming === allowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────
app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/restaurants', restaurantRouter);
app.use('/api/v1/customer', customerRouter);
app.use('/api/v1', paymentsRouter);

// ─── Error Handler ───────────────────────────────────────
app.use(errorHandler);


export default app;
