import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './utils/config';
import prisma from './utils/prisma';
import apiRoutes from './routes';
import { requestLogger } from './middleware/logger.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const server = http.createServer(app);

// 1. Basic Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        config.isDevelopment &&
        (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))
      ) {
        return callback(null, true);
      }
      if (origin === config.clientUrl) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Request Logger Middleware
app.use(requestLogger);

// 3. API Routes
app.use('/api', apiRoutes);

// 3b. Root & Direct Health Check
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'SI-TARUNA Backend API Server Running',
    version: '1.0.0',
    mode: config.env,
    apiBase: '/api',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// 4. 404 Not Found Middleware
app.use(notFoundHandler);

// 5. Centralized Error Handler Middleware
app.use(errorHandler);

// 6. Server Initialization & Graceful Shutdown
if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`🚀 SI-TARUNA Backend API Server`);
    console.log(`📡 Port: ${config.port} | Mode: ${config.env}`);
    console.log(`🔗 Health: http://localhost:${config.port}/api/health`);
    console.log(`===============================================`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`\n[${signal}] Received. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await prisma.$disconnect();
      console.log('Database connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

export { app, server };
