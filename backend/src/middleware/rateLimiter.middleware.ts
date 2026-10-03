import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil?: number;
}

// In-memory sliding window rate limiter
const loginAttempts = new Map<string, RateLimitRecord>();

// Cleanup stale records every 10 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 menit
  loginAttempts.forEach((record, key) => {
    if (now - record.lastAttemptAt > windowMs && (!record.blockedUntil || now > record.blockedUntil)) {
      loginAttempts.delete(key);
    }
  });
}, 10 * 60 * 1000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export interface RateLimitOptions {
  windowMs?: number; // Jendela waktu (default: 15 menit)
  maxAttempts?: number; // Maksimum percobaan (default: 5)
  blockDurationMs?: number; // Durasi blokir jika melebihi batas (default: 15 menit)
}

/**
 * Middleware: loginRateLimiter
 * Mencegah serangan brute-force login dengan membatasi percobaan login berdasarkan IP dan username
 */
export const loginRateLimiter = (options: RateLimitOptions = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 menit
  const maxAttempts = options.maxAttempts || 5; // 5 kali percobaan
  const blockDurationMs = options.blockDurationMs || 15 * 60 * 1000; // 15 menit blokir

  return (req: Request, res: Response, next: NextFunction): void => {
    // Lewati rate limiting saat running test suite otomatis
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const username = req.body?.username ? String(req.body.username).trim().toLowerCase() : '';
    const key = `login_${ip}_${username || 'anon'}`;
    const now = Date.now();

    const record = loginAttempts.get(key);

    if (record) {
      // 1. Cek apakah IP/akun sedang dalam masa blokir (cooldown)
      if (record.blockedUntil && now < record.blockedUntil) {
        const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
        res.setHeader('Retry-After', remainingSeconds);
        res.setHeader('X-RateLimit-Limit', maxAttempts);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(record.blockedUntil).toISOString());

        sendError(
          res,
          `Terlalu banyak percobaan login gagal. Demi keamanan akun SI-TARUNA, silakan tunggu ${remainingSeconds} detik sebelum mencoba kembali.`,
          [{ field: 'rate_limit', retryAfterSeconds: remainingSeconds }],
          429
        );
        return;
      }

      // 2. Jika jendela waktu lama telah berlalu, reset hitungan
      if (now - record.firstAttemptAt > windowMs) {
        loginAttempts.set(key, {
          attempts: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
        });
      } else {
        // Tambahkan percobaan
        record.attempts += 1;
        record.lastAttemptAt = now;

        // Jika melebihi batas maksimum percobaan, blokir akun/IP
        if (record.attempts > maxAttempts) {
          record.blockedUntil = now + blockDurationMs;
          const remainingSeconds = Math.ceil(blockDurationMs / 1000);

          res.setHeader('Retry-After', remainingSeconds);
          res.setHeader('X-RateLimit-Limit', maxAttempts);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', new Date(record.blockedUntil).toISOString());

          sendError(
            res,
            `Batas percobaan login (${maxAttempts}x) terlampaui. Akses login dibatasi selama 15 menit demi keamanan sistem.`,
            [{ field: 'rate_limit', retryAfterSeconds: remainingSeconds }],
            429
          );
          return;
        }
      }
    } else {
      // Record pertama kali
      loginAttempts.set(key, {
        attempts: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      });
    }

    const currentAttempts = loginAttempts.get(key)?.attempts || 1;
    res.setHeader('X-RateLimit-Limit', maxAttempts);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - currentAttempts));

    next();
  };
};

/**
 * Reset rate limit counter (misal setelah login berhasil)
 */
export const resetLoginRateLimit = (ip: string, username?: string): void => {
  const key = `login_${ip}_${username ? username.trim().toLowerCase() : 'anon'}`;
  loginAttempts.delete(key);
};
