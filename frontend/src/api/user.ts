import type { User } from '../types'

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

// ユーザー情報更新のリクエスト型
export interface UpdateUserRequest {
  username?: string
  avatar_url?: string
}

// ユーザー情報を更新
export const updateUser = async (updateData: UpdateUserRequest): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update user')
  }
  
  const data = await response.json()
  return data.user
}

// 現在のユーザー情報を取得
export const getCurrentUser = async (): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders()
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get user info')
  }
  
  const data = await response.json()
  return data.user
}