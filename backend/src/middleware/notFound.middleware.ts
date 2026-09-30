import { Request, Response } from 'express';
import { sendError } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(
    res,
    `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
    [],
    404
  );
};
