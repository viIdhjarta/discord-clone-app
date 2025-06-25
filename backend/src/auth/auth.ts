import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { hashPassword, verifyPassword } from '../utils/password';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export async function registerUser(
  pool: Pool,
  username: string,
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  // メール重複チェック
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email or username already exists');
  }

  // パスワードハッシュ化
  const passwordHash = await hashPassword(password);

  // ユーザー作成
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, avatar_url, created_at, updated_at',
    [username, email, passwordHash]
  );

  const user = result.rows[0];
  const token = generateToken({ userId: user.id, email: user.email, username: user.username });

  return { user, token };
}

export async function loginUser(
  pool: Pool,
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  // ユーザー取得
  const result = await pool.query(
    'SELECT id, username, email, password_hash, avatar_url, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // パスワード検証
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // パスワードハッシュを除去してクリーンなユーザーオブジェクトを作成
  const { password_hash, ...cleanUser } = user;
  const token = generateToken({ userId: user.id, email: user.email, username: user.username });

  return { user: cleanUser, token };
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export async function getUserById(pool: Pool, userId: number): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, username, email, avatar_url, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}