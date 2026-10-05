import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './utils/config';
import prisma from './utils/prisma';
import apiRoutes from './routes';
import { requestLogger } from './middleware/logger.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';
import { initSocketServer } from './socket';
import { ReminderService } from './services/reminder.service';
import { securityHeaders, xssSanitizer } from './middleware/security.middleware';

const app = express();
const server = http.createServer(app);

// Sembunyikan informasi banner server Express untuk keamanan
app.disable('x-powered-by');

// Inisialisasi Socket.IO Realtime Server
const io = initSocketServer(server);

// 1. Security Headers (Anti-Sniffing, Anti-Clickjacking, XSS Protection)
app.use(securityHeaders);

// 2. CORS (Cross-Origin Resource Sharing) Terkonfigurasi Aman
app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (seperti curl, mobile app, postman, server-to-server)
      if (!origin) return callback(null, true);

      // Mode development: Izinkan semua origin (localhost, 127.0.0.1, LAN IP)
      if (config.isDevelopment) {
        return callback(null, true);
      }

      // Mode production: Cek whitelist origin
      if (config.allowedOrigins.includes(origin) || origin === config.clientUrl) {
        return callback(null, true);
      }

      return callback(new Error(`Akses diblokir oleh CORS policy: Origin ${origin} tidak diizinkan`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    maxAge: 86400, // 24 jam preflight cache
  })
);

// 3. Body Parser dengan Pembatasan Ukuran Payload
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. XSS Input Sanitizer Middleware
app.use(xssSanitizer);

// 5. Request Logger Middleware
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
  server.listen(config.port, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 SI-TARUNA Backend API Server`);
    console.log(`📡 Port: ${config.port} | Mode: ${config.env}`);
    console.log(`🔗 Health: http://localhost:${config.port}/api/health`);
    console.log(`===============================================`);

    // Inisialisasi Automatic Event Reminder Scheduler (Module 24)
    ReminderService.startScheduler();
  });

  const handleShutdown = async (signal: string) => {
    console.log(`\n[${signal}] Received. Shutting down gracefully...`);
    ReminderService.stopScheduler();
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

export { app, server, io };
