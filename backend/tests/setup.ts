process.env.NODE_ENV = 'test';

import request from 'supertest';
import { app } from '../src/server';
import { AuthService } from '../src/services/auth.service';

let adminTokenCache: string | null = null;
let memberTokenCache: string | null = null;
let adminUserIdCache: string | null = null;
let memberUserIdCache: string | null = null;

export const getAdminAuth = async () => {
  if (adminTokenCache && adminUserIdCache) {
    return { token: adminTokenCache, userId: adminUserIdCache };
  }
  const result = await AuthService.login('admin', 'admin123');
  adminTokenCache = result.token;
  adminUserIdCache = result.user.id;
  return { token: adminTokenCache, userId: adminUserIdCache };
};

export const getMemberAuth = async () => {
  if (memberTokenCache && memberUserIdCache) {
    return { token: memberTokenCache, userId: memberUserIdCache };
  }
  const result = await AuthService.login('member', 'member123');
  memberTokenCache = result.token;
  memberUserIdCache = result.user.id;
  return { token: memberTokenCache, userId: memberUserIdCache };
};

export { request, app };
