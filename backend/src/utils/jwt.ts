import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from './config';

export interface TokenPayload {
  id: string;
  username: string;
  role: Role;
}

export class JwtUtil {
  public static sign(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  public static verify(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  }
}
