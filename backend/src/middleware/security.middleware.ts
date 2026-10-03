import { Request, Response, NextFunction } from 'express';

/**
 * Membersihkan string dari potensi injeksi skrip XSS
 */
export const sanitizeXSS = (input: string): string => {
  if (typeof input !== 'string') return input;

  return input
    // Hapus null byte
    .replace(/\0/g, '')
    // Ganti tag script
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Netralkan event handler HTML berbahaya (onload=, onerror=, dll)
    .replace(/on\w+\s*=/gi, '')
    // Netralkan skema URI berbahaya
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '');
};

/**
 * Rekursif membersihkan objek dari karakter atau pola XSS
 */
export const deepSanitize = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeXSS(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepSanitize(item));
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      // Netralkan key dan value
      const sanitizedKey = sanitizeXSS(key);
      cleaned[sanitizedKey] = deepSanitize(obj[key]);
    }
    return cleaned;
  }

  return obj;
};

/**
 * Middleware: securityHeaders
 * Menetapkan HTTP Security Headers untuk pertahanan mendalam (defense in depth):
 * - XSS Protection
 * - Content Sniffing Protection (nosniff)
 * - Clickjacking Protection (SAMEORIGIN)
 * - Referrer Policy
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Sembunyikan identitas express server
  res.removeHeader('X-Powered-By');

  // Anti-MIME Sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Anti-Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // XSS Protection filter di browser lawas
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};

/**
 * Middleware: xssSanitizer
 * Sanitasi otomatis payload body, query, dan params dari potensi injeksi XSS
 */
export const xssSanitizer = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = deepSanitize(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = deepSanitize(req.params);
  }

  next();
};
