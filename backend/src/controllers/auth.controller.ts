import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      sendSuccess(res, 'Login berhasil. Selamat datang di SI-TARUNA!', result, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getMe(userId);

      sendSuccess(res, 'Data sesi pengguna berhasil diambil', user, 200);
    } catch (error) {
      next(error);
    }
  }
}
