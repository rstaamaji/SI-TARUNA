import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service';
import { sendSuccess, sendError } from '../utils/response';

export class HealthController {
  public static async getHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const healthData = await HealthService.checkHealth();

      if (healthData.status === 'degraded') {
        sendError(res, 'SI-TARUNA API is degraded: Database is unreachable', [healthData], 503);
        return;
      }

      sendSuccess(res, 'SI-TARUNA API is running', healthData, 200);
    } catch (error) {
      next(error);
    }
  }
}
