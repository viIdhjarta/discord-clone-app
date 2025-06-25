import { useEffect, useRef, useState } from 'react'
import type { WebSocketMessage } from '../types'
import { messagesApi, type Message } from '../api/messages'

export const useWebSocket = (url: string, channelId: number | null = null) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const currentChannelIdRef = useRef<number | null>(channelId)

  // Update current channel ID reference
  useEffect(() => {
    currentChannelIdRef.current = channelId
  }, [channelId])

  // Load initial messages from API when channel changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!channelId) {
        setMessages([])
        return
      }

      try {
        setIsLoading(true)
        const apiMessages = await messagesApi.getMessages(channelId)
        // Convert API messages to WebSocket message format
        const wsMessages: WebSocketMessage[] = apiMessages.map(msg => ({
          type: 'message',
          data: {
            id: msg.id,
            content: msg.content,
            user: { username: msg.username },
            channel_id: msg.channel_id,
            created_at: msg.created_at
          }
        }))
        setMessages(wsMessages)
      } catch (error) {
        console.error('Failed to load initial messages:', error)
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [channelId])

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
        }

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            if (message.type === 'message') {
              // Only add messages that belong to the current channel
              if (message.data?.channel_id === currentChannelIdRef.current) {
                setMessages(prev => {
                  // 重複チェック: 同じIDのメッセージが既に存在する場合は追加しない
                  const messageId = message.data?.id
                  if (messageId && prev.some(msg => msg.data?.id === messageId)) {
                    return prev
                  }
                  return [...prev, message]
                })
              }
            } else if (message.type === 'welcome') {
              // Welcome messages are shown regardless of channel
              setMessages(prev => [...prev, message])
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected')
          setIsConnected(false)
          
          // Reconnect after 3 seconds
          setTimeout(connect, 3000)
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
        setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [url])

  const sendMessage = async (message: any) => {
    try {
      if (message.type === 'message' && message.data) {
        // Send message via API instead of WebSocket
        await messagesApi.sendMessage({
          content: message.data.content,
          channel_id: message.data.channel_id
        })
        // Message will be broadcasted via WebSocket from the backend
      }
    } catch (error) {
      console.error('Failed to send message via API:', error)
    }
  }

  return {
    isConnected,
    messages,
    sendMessage,
    isLoading,
  }
}