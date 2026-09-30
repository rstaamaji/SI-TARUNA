import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/response';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error | AppError | ZodError | any,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // 1. Handled AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.errors, err.statusCode);
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validasi input gagal', formattedErrors, 400);
  }

  // 3. Prisma Known Request Error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(', ')
        : 'field';
      return sendError(
        res,
        `Data dengan ${target} tersebut sudah terdaftar di sistem`,
        [{ field: target, message: 'Nilai duplikat ditemukan' }],
        409
      );
    }

    if (err.code === 'P2025') {
      return sendError(res, 'Data yang diminta tidak ditemukan di database', [], 404);
    }

    return sendError(res, `Database error: ${err.message}`, [], 400);
  }

  // 4. Malformed JSON Body
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 'Format JSON pada request body tidak valid', [], 400);
  }

  // 5. Default Internal Server Error
  console.error('[Unhandled Error]', err);
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan internal pada server'
      : err.message || 'Internal Server Error';

  return sendError(res, message, [], 500);
};
