import { Hono } from 'hono';
import { Pool } from 'pg';
import { z } from 'zod';
import { registerUser, loginUser, getUserById } from '../auth/auth';
import { authMiddleware, getAuthUser } from '../middleware/auth';

const auth = new Hono<{ Variables: { pool: Pool } }>();

// バリデーションスキーマ
const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  avatar_url: z.string().url('Invalid URL format').optional().or(z.literal(''))
});

// ユーザー登録
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { username, email, password } = registerSchema.parse(body);

    const pool = c.get('pool');
    const { user, token } = await registerUser(pool, username, email, password);

    return c.json({
      message: 'User registered successfully',
      user,
      token
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors
      }, 400);
    }

    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    
    if (errorMessage.includes('already exists')) {
      return c.json({ error: errorMessage }, 409);
    }

    return c.json({ error: errorMessage }, 500);
  }
});

// ログイン
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);

    const pool = c.get('pool');
    const { user, token } = await loginUser(pool, email, password);

    return c.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors
      }, 400);
    }

    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    
    if (errorMessage.includes('Invalid email or password')) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    return c.json({ error: errorMessage }, 500);
  }
});

// ログアウト（クライアント側でトークン削除するだけなので、成功レスポンスのみ）
auth.post('/logout', authMiddleware, async (c) => {
  return c.json({ message: 'Logout successful' });
});

// 現在のユーザー情報取得
auth.get('/me', authMiddleware, async (c) => {
  try {
    const authUser = getAuthUser(c);
    const pool = c.get('pool');
    
    const user = await getUserById(pool, authUser.userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get user info';
    return c.json({ error: errorMessage }, 500);
  }
});

// ユーザー情報更新
auth.put('/me', authMiddleware, async (c) => {
  try {
    const authUser = getAuthUser(c);
    const body = await c.req.json();
    const updateData = updateUserSchema.parse(body);
    
    const pool = c.get('pool');
    
    // 更新するフィールドと値を動的に構築
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCounter = 1;
    
    if (updateData.username !== undefined) {
      // ユーザー名の重複チェック
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [updateData.username, authUser.userId]
      );
      
      if (existingUser.rows.length > 0) {
        return c.json({ error: 'Username already exists' }, 409);
      }
      
      updateFields.push(`username = $${paramCounter}`);
      updateValues.push(updateData.username);
      paramCounter++;
    }
    
    if (updateData.avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramCounter}`);
      updateValues.push(updateData.avatar_url === '' ? null : updateData.avatar_url);
      paramCounter++;
    }
    
    if (updateFields.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }
    
    // updated_atフィールドも更新
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(authUser.userId);
    
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING id, username, email, avatar_url, created_at, updated_at
    `;
    
    const result = await pool.query(updateQuery, updateValues);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors
      }, 400);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
    return c.json({ error: errorMessage }, 500);
  }
});

export default auth;