import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { morganMiddleware } from './config/logger';
import { errorHandler } from './middlewares/error.middleware';
import { NotFoundError } from './utils/errors';
import authRouter from './routes/auth.routes';

const app: Express = express();

// Request Tracing logger
app.use(morganMiddleware);

// Dynamic CORS configurations
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Standard parsers
app.use(express.json());
app.use(cookieParser());

// Server health check route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'ffairdrop backend engine is active.',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// API Routes Scaffolding
app.use('/api/auth', authRouter);

// Capture any unmatched routes as NotFoundExceptions
app.use((_req: Request, _res: Response, next) => {
  next(new NotFoundError(`Route ${_req.method} ${_req.url} does not exist.`));
});

// Bind centralized JSON error response processor
app.use(errorHandler);

export default app;
