const API_BASE_URL = 'http://localhost:3001'

export interface Message {
  id: number
  content: string
  username: string
  user_id: number
  channel_id: number
  created_at: string
}

export interface SendMessageRequest {
  content: string
  channel_id: number
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('discord_clone_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

export const messagesApi = {
  async getMessages(channelId: number): Promise<Message[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages?channel_id=${channelId}`, {
        headers: getAuthHeaders()
      })
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      return data.messages
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  },

  async sendMessage(message: SendMessageRequest): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(message),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      // APIレスポンスは使用せず、WebSocketブロードキャストに依存
      await response.json()
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }
}