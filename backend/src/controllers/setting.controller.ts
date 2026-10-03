import { Request, Response, NextFunction } from 'express';
import { SettingService } from '../services/setting.service';
import { sendSuccess } from '../utils/response';

export class SettingController {
  /**
   * GET /api/settings/organization
   * Endpoint publik/frontend untuk membaca konfigurasi organisasi
   */
  static async getOrganizationConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await SettingService.getOrganizationConfig();
      sendSuccess(res, 'Berhasil memuat konfigurasi organisasi', config, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/settings/organization
   * Endpoint khusus ADMIN untuk memperbarui data organisasi
   */
  static async updateOrganizationConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedConfig = await SettingService.updateOrganizationConfig(req.body);
      sendSuccess(res, 'Konfigurasi organisasi berhasil diperbarui', updatedConfig, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/settings/organization/reset
   * Endpoint khusus ADMIN untuk mereset ke konfigurasi bawaan
   */
  static async resetOrganizationConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const resetConfig = await SettingService.resetToDefault();
      sendSuccess(res, 'Konfigurasi organisasi berhasil direset ke default', resetConfig, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/settings/security-status
   * Menampilkan verifikasi bahwa secret keys disimpan di env, bukan database
   */
  static async getSecurityStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = SettingService.getSecurityStatus();
      sendSuccess(res, 'Status kepatuhan keamanan rahasia sistem berhasil dimuat', status, 200);
    } catch (error) {
      next(error);
    }
  }
}
