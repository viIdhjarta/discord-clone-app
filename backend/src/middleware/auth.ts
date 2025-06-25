import { Context, Next } from 'hono';
import { verifyToken, JWTPayload } from '../auth/auth';

export interface AuthContext {
  user: JWTPayload;
}

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization header required' }, 401);
  }

  const token = authHeader.substring(7); // "Bearer " を除去

  try {
    const payload = verifyToken(token);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export function getAuthUser(c: Context): JWTPayload {
  return c.get('user');
}