export interface User {
  id: number
  username: string
  email: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Server {
  id: number
  name: string
  icon_url?: string
  owner_id: number
  created_at: string
  updated_at: string
  role?: 'owner' | 'admin' | 'member'
}

export interface Channel {
  id: number
  name: string
  type: 'text' | 'voice' | 'dm'
  server_id?: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  content: string
  user_id: number
  channel_id: number
  created_at: string
  updated_at: string
  user?: User
}

export interface WebSocketMessage {
  type: 'message' | 'welcome' | 'user_joined' | 'user_left'
  data?: any
  message?: string
  user?: User
  channel_id?: number
}