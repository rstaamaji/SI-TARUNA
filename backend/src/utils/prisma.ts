import { PrismaClient } from '@prisma/client';
import { config } from './config';

declare global {
  var prismaInstance: PrismaClient | undefined;
}

const prisma =
  global.prismaInstance ||
  new PrismaClient({
    log: config.isDevelopment ? ['error', 'warn'] : ['error'],
  });

if (config.isDevelopment) {
  global.prismaInstance = prisma;
}

export default prisma;
