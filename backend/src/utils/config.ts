import dotenv from 'dotenv';
import path from 'path';

// 1. Load environment variables from current working directory or relative path
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// 2. Parse allowed CORS origins from environment
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:3000';
const parsedOrigins = rawAllowedOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Always ensure default dev origins in development mode
const allowedOrigins = isDevelopment
  ? Array.from(new Set([...parsedOrigins, 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']))
  : parsedOrigins;

// 3. Validate Production Critical Variables
if (isProduction) {
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ [FATAL] DATABASE_URL environment variable must be set in production mode.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'si_taruna_default_secret_key_2026') {
    throw new Error('❌ [FATAL] Secure JWT_SECRET environment variable must be explicitly provided in production mode.');
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  allowedOrigins,
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'si_taruna_default_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  isProduction,
  isDevelopment,
};
