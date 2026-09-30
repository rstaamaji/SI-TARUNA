import prisma from '../utils/prisma';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded';
  database: {
    status: 'connected' | 'disconnected';
    latencyMs: number;
  };
  uptime: number;
  timestamp: string;
}

export class HealthService {
  public static async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      // Execute lightweight query to verify active PostgreSQL connection via Prisma
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      console.error('[HealthService] Database connection check failed:', error);
      dbStatus = 'disconnected';
    }

    const latencyMs = Date.now() - start;

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      database: {
        status: dbStatus,
        latencyMs,
      },
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
