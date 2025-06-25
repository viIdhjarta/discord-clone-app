import type { Server, Channel } from '../types'

const API_BASE_URL = 'http://localhost:3001/api'

// 認証トークンを取得する関数
const getAuthToken = () => {
  return localStorage.getItem('discord_clone_token')
}

// APIリクエストのヘッダーを作成
const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

// ユーザーが所属するサーバー一覧を取得
export const getUserServers = async (): Promise<Server[]> => {
  const response = await fetch(`${API_BASE_URL}/servers`, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch servers')
  }
  
  const data = await response.json()
  return data.servers
}

// 新規サーバーを作成
export const createServer = async (name: string, iconUrl?: string): Promise<Server> => {
  const response = await fetch(`${API_BASE_URL}/servers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name,
      icon_url: iconUrl
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create server')
  }
  
  const data = await response.json()
  return data.server
}

// サーバーのチャンネル一覧を取得
export const getServerChannels = async (serverId: number): Promise<Channel[]> => {
  const response = await fetch(`${API_BASE_URL}/servers/${serverId}/channels`, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch channels')
  }
  
  const data = await response.json()
  return data.channels
}

// サーバーに参加
export const joinServer = async (serverId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/servers/${serverId}/join`, {
    method: 'POST',
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to join server')
  }
}

// チャンネルを作成
export const createChannel = async (serverId: number, name: string, type: 'text' | 'voice' = 'text'): Promise<Channel> => {
  const response = await fetch(`${API_BASE_URL}/servers/${serverId}/channels`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      name,
      type
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create channel')
  }
  
  const data = await response.json()
  return data.channel
}