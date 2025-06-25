import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import * as dotenv from 'dotenv'
import { WebSocketServer } from 'ws'
import { initializeDatabase, pool } from './database'
import authRoutes from './routes/auth'
import serversRoutes from './routes/servers'
import { authMiddleware, getAuthUser } from './middleware/auth'

dotenv.config()

const app = new Hono<{ Variables: { pool: any } }>()

// CORS configuration
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// Database pool middleware
app.use('*', async (c, next) => {
  c.set('pool', pool)
  await next()
})

// Auth routes
app.route('/api/auth', authRoutes)

// Server routes
app.route('/api/servers', serversRoutes)

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.get('/api/messages', authMiddleware, async (c) => {
  try {
    const authUser = getAuthUser(c)
    const channelId = c.req.query('channel_id')
    
    if (!channelId) {
      return c.json({ error: 'channel_id is required' }, 400)
    }
    
    // ユーザーがチャンネルのサーバーのメンバーかチェック
    const memberCheck = await pool.query(`
      SELECT sm.role
      FROM server_members sm
      JOIN channels c ON sm.server_id = c.server_id
      WHERE sm.user_id = $1 AND c.id = $2
    `, [authUser.userId, channelId])
    
    if (memberCheck.rows.length === 0) {
      return c.json({ error: 'Access denied' }, 403)
    }
    
    const result = await pool.query(`
      SELECT m.id, m.content, m.user_id, m.channel_id, 
             m.created_at AT TIME ZONE 'UTC' AS created_at, u.username 
      FROM messages m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.channel_id = $1
      ORDER BY m.created_at ASC
    `, [channelId])
    
    // Convert timestamps to ISO string format
    const messagesWithIsoTimestamps = result.rows.map(row => ({
      ...row,
      created_at: row.created_at.toISOString()
    }))
    
    return c.json({ messages: messagesWithIsoTimestamps })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return c.json({ error: 'Failed to fetch messages' }, 500)
  }
})

app.post('/api/messages', authMiddleware, async (c) => {
  try {
    const body = await c.req.json()
    const { content, channel_id } = body
    const authUser = getAuthUser(c)
    
    if (!content) {
      return c.json({ error: 'Content is required' }, 400)
    }
    
    if (!channel_id) {
      return c.json({ error: 'channel_id is required' }, 400)
    }
    
    // ユーザーがチャンネルのサーバーのメンバーかチェック
    const memberCheck = await pool.query(`
      SELECT sm.role
      FROM server_members sm
      JOIN channels c ON sm.server_id = c.server_id
      WHERE sm.user_id = $1 AND c.id = $2
    `, [authUser.userId, channel_id])
    
    if (memberCheck.rows.length === 0) {
      return c.json({ error: 'Access denied' }, 403)
    }
    
    // Insert message
    const insertResult = await pool.query(
      'INSERT INTO messages (content, user_id, channel_id) VALUES ($1, $2, $3) RETURNING *',
      [content, authUser.userId, channel_id]
    )
    
    // Get message with username
    const messageResult = await pool.query(`
      SELECT m.id, m.content, m.user_id, m.channel_id, 
             m.created_at AT TIME ZONE 'UTC' AS created_at, u.username 
      FROM messages m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = $1
    `, [insertResult.rows[0].id])
    
    const newMessage = messageResult.rows[0]
    
    // Broadcast to WebSocket clients
    const wsMessage = {
      type: 'message',
      data: {
        id: newMessage.id,
        content: newMessage.content,
        user: { username: newMessage.username },
        user_id: newMessage.user_id,
        channel_id: newMessage.channel_id,
        created_at: newMessage.created_at.toISOString()
      }
    }
    
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(wsMessage))
      }
    })
    
    return c.json({ message: 'Message sent successfully', data: newMessage })
  } catch (error) {
    console.error('Error saving message:', error)
    return c.json({ error: 'Failed to save message' }, 500)
  }
})

// Start HTTP server
const port = parseInt(process.env.PORT || '3001')

// WebSocket server will be created with the HTTP server
let wss: WebSocketServer

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase()
    
    // Start HTTP server with WebSocket support
    serve({
      fetch: app.fetch,
      port: port,
    })
    
    // Create WebSocket server
    wss = new WebSocketServer({ 
      port: port + 1  // WebSocket on port 3002
    })

    wss.on('connection', (ws) => {
      console.log('New WebSocket connection established')
      
      ws.on('message', (message) => {
        console.log('Received WebSocket message:', message.toString())
        // Note: Direct WebSocket messages are no longer processed here
        // Messages should be sent via POST /api/messages for persistence
      })
      
      ws.on('close', () => {
        console.log('WebSocket connection closed')
      })
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to Discord Clone WebSocket server'
      }))
    })
    
    console.log(`🚀 HTTP Server running on http://localhost:${port}`)
    console.log(`📡 WebSocket server ready on ws://localhost:${port + 1}`)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()