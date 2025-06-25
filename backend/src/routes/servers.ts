import { Hono } from 'hono'
import { authMiddleware, getAuthUser } from '../middleware/auth'
import { pool } from '../database'

const serversRouter = new Hono()

// ユーザーが所属するサーバー一覧を取得
serversRouter.get('/', authMiddleware, async (c) => {
  try {
    const authUser = getAuthUser(c)
    
    const result = await pool.query(`
      SELECT s.id, s.name, s.icon_url, s.owner_id, s.created_at, sm.role
      FROM servers s
      JOIN server_members sm ON s.id = sm.server_id
      WHERE sm.user_id = $1
      ORDER BY s.created_at ASC
    `, [authUser.userId])
    
    return c.json({ servers: result.rows })
  } catch (error) {
    console.error('Error fetching servers:', error)
    return c.json({ error: 'Failed to fetch servers' }, 500)
  }
})

// 新規サーバーを作成
serversRouter.post('/', authMiddleware, async (c) => {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const { name, icon_url } = body
    
    if (!name || name.trim().length === 0) {
      return c.json({ error: 'Server name is required' }, 400)
    }
    
    if (name.length > 100) {
      return c.json({ error: 'Server name must be 100 characters or less' }, 400)
    }
    
    // トランザクション開始
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // サーバーを作成
      const serverResult = await client.query(
        'INSERT INTO servers (name, icon_url, owner_id) VALUES ($1, $2, $3) RETURNING *',
        [name.trim(), icon_url || null, authUser.userId]
      )
      
      const newServer = serverResult.rows[0]
      
      // サーバーメンバーとして追加（ownerロール）
      await client.query(
        'INSERT INTO server_members (user_id, server_id, role) VALUES ($1, $2, $3)',
        [authUser.userId, newServer.id, 'owner']
      )
      
      // デフォルトチャンネル（general）を作成
      await client.query(
        'INSERT INTO channels (name, server_id, type) VALUES ($1, $2, $3)',
        ['general', newServer.id, 'text']
      )
      
      await client.query('COMMIT')
      
      return c.json({ 
        message: 'Server created successfully',
        server: {
          ...newServer,
          role: 'owner'
        }
      })
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('Error creating server:', error)
    return c.json({ error: 'Failed to create server' }, 500)
  }
})

// 特定のサーバーのチャンネル一覧を取得
serversRouter.get('/:serverId/channels', authMiddleware, async (c) => {
  try {
    const authUser = getAuthUser(c)
    const serverId = c.req.param('serverId')
    
    // ユーザーがサーバーのメンバーかチェック
    const memberCheck = await pool.query(
      'SELECT role FROM server_members WHERE user_id = $1 AND server_id = $2',
      [authUser.userId, serverId]
    )
    
    if (memberCheck.rows.length === 0) {
      return c.json({ error: 'Access denied' }, 403)
    }
    
    const result = await pool.query(`
      SELECT id, name, type, created_at
      FROM channels
      WHERE server_id = $1
      ORDER BY created_at ASC
    `, [serverId])
    
    return c.json({ channels: result.rows })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return c.json({ error: 'Failed to fetch channels' }, 500)
  }
})

// サーバーに参加（招待コード機能は後で実装）
serversRouter.post('/:serverId/join', authMiddleware, async (c) => {
  try {
    const authUser = getAuthUser(c)
    const serverId = c.req.param('serverId')
    
    // 既にメンバーかチェック
    const existingMember = await pool.query(
      'SELECT id FROM server_members WHERE user_id = $1 AND server_id = $2',
      [authUser.userId, serverId]
    )
    
    if (existingMember.rows.length > 0) {
      return c.json({ error: 'Already a member of this server' }, 400)
    }
    
    // サーバーが存在するかチェック
    const serverCheck = await pool.query(
      'SELECT id, name FROM servers WHERE id = $1',
      [serverId]
    )
    
    if (serverCheck.rows.length === 0) {
      return c.json({ error: 'Server not found' }, 404)
    }
    
    // メンバーとして追加
    await pool.query(
      'INSERT INTO server_members (user_id, server_id, role) VALUES ($1, $2, $3)',
      [authUser.userId, serverId, 'member']
    )
    
    return c.json({ 
      message: 'Successfully joined server',
      server: serverCheck.rows[0]
    })
    
  } catch (error) {
    console.error('Error joining server:', error)
    return c.json({ error: 'Failed to join server' }, 500)
  }
})

// サーバーに新しいチャンネルを作成
serversRouter.post('/:serverId/channels', authMiddleware, async (c) => {
  try {
    const authUser = getAuthUser(c)
    const serverId = c.req.param('serverId')
    const body = await c.req.json()
    const { name, type = 'text' } = body
    
    if (!name || name.trim().length === 0) {
      return c.json({ error: 'Channel name is required' }, 400)
    }
    
    if (name.length > 100) {
      return c.json({ error: 'Channel name must be 100 characters or less' }, 400)
    }
    
    // チャンネル名の形式チェック（英数字、日本語、ハイフン、アンダースコアのみ）
    const channelNameRegex = /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]+$/
    if (!channelNameRegex.test(name.trim())) {
      return c.json({ error: 'Channel name contains invalid characters' }, 400)
    }
    
    if (!['text', 'voice'].includes(type)) {
      return c.json({ error: 'Invalid channel type' }, 400)
    }
    
    // ユーザーがサーバーのメンバーで、owner または admin かチェック
    const memberCheck = await pool.query(
      'SELECT role FROM server_members WHERE user_id = $1 AND server_id = $2',
      [authUser.userId, serverId]
    )
    
    if (memberCheck.rows.length === 0) {
      return c.json({ error: 'Access denied' }, 403)
    }
    
    const userRole = memberCheck.rows[0].role
    if (!['owner', 'admin'].includes(userRole)) {
      return c.json({ error: 'Only server owners and admins can create channels' }, 403)
    }
    
    // 同じサーバー内での重複チャンネル名チェック
    const existingChannel = await pool.query(
      'SELECT id FROM channels WHERE server_id = $1 AND LOWER(name) = LOWER($2)',
      [serverId, name.trim()]
    )
    
    if (existingChannel.rows.length > 0) {
      return c.json({ error: 'Channel name already exists in this server' }, 409)
    }
    
    // チャンネルを作成
    const result = await pool.query(
      'INSERT INTO channels (name, type, server_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), type, serverId]
    )
    
    const newChannel = result.rows[0]
    
    return c.json({
      message: 'Channel created successfully',
      channel: newChannel
    })
    
  } catch (error) {
    console.error('Error creating channel:', error)
    return c.json({ error: 'Failed to create channel' }, 500)
  }
})

export default serversRouter