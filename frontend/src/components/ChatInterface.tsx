import { useState, useEffect, useRef } from 'react'
import { PaperAirplaneIcon, HashtagIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../contexts/AuthContext'
import { ServerList } from './ServerList'
import { ChannelList } from './ChannelList'
import { CreateServerModal } from './CreateServerModal'
import { CreateChannelModal } from './CreateChannelModal'
import { UserSettingsModal } from './UserSettingsModal'
import type { WebSocketMessage, Server, Channel } from '../types'
import { getUserServers, getServerChannels } from '../api/servers'

const WEBSOCKET_URL = 'ws://localhost:3002'

export const ChatInterface = () => {
  const [inputMessage, setInputMessage] = useState('')
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null)
  const [currentServer, setCurrentServer] = useState<Server | null>(null)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [showCreateServerModal, setShowCreateServerModal] = useState(false)
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  const [showUserSettingsModal, setShowUserSettingsModal] = useState(false)
  
  const { user, logout } = useAuth()
  const { isConnected, messages, sendMessage, isLoading } = useWebSocket(WEBSOCKET_URL, selectedChannelId)
  
  // スクロール制御用のref
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 最下部にスクロールする関数
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    })
  }

  // ユーザーが最下部付近にいるかチェック
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true
    
    const container = messagesContainerRef.current
    const threshold = 100 // 100px以内なら最下部とみなす
    
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    )
  }

  // サーバーが選択されたときの処理
  useEffect(() => {
    const fetchServerInfo = async () => {
      if (!selectedServerId) {
        setCurrentServer(null)
        return
      }

      try {
        const servers = await getUserServers()
        const server = servers.find(s => s.id === selectedServerId)
        setCurrentServer(server || null)
      } catch (error) {
        console.error('Failed to fetch server info:', error)
      }
    }

    fetchServerInfo()
  }, [selectedServerId])

  // チャンネルが選択されたときの処理
  useEffect(() => {
    const fetchChannelInfo = async () => {
      if (!selectedChannelId || !selectedServerId) {
        setCurrentChannel(null)
        return
      }

      try {
        const channels = await getServerChannels(selectedServerId)
        const channel = channels.find(c => c.id === selectedChannelId)
        setCurrentChannel(channel || null)
      } catch (error) {
        console.error('Failed to fetch channel info:', error)
      }
    }

    fetchChannelInfo()
  }, [selectedChannelId, selectedServerId])

  const handleServerSelect = (serverId: number) => {
    setSelectedServerId(serverId)
    setSelectedChannelId(null) // チャンネル選択をリセット
  }

  const handleChannelSelect = (channelId: number) => {
    setSelectedChannelId(channelId)
  }

  const handleCreateServer = () => {
    setShowCreateServerModal(true)
  }

  const handleServerCreated = (server: Server) => {
    setSelectedServerId(server.id)
    setShowCreateServerModal(false)
  }

  const handleCreateChannel = () => {
    setShowCreateChannelModal(true)
  }

  const handleChannelCreated = (channel: Channel) => {
    setSelectedChannelId(channel.id)
    setShowCreateChannelModal(false)
  }

  // メッセージが変更されたときの自動スクロール
  useEffect(() => {
    if (messages.length > 0) {
      // ロード中の場合は常にスクロール（初回読み込み時）
      if (isLoading) {
        scrollToBottom(false)
        return
      }
      
      // 新しいメッセージ追加時は、ユーザーが最下部付近にいる場合のみスクロール
      if (isNearBottom()) {
        scrollToBottom(true)
      }
    }
  }, [messages, isLoading])

  // チャンネル変更時に最下部にスクロール
  useEffect(() => {
    if (selectedChannelId && !isLoading) {
      // チャンネル変更時は少し遅延を入れてスクロール
      const timer = setTimeout(() => {
        scrollToBottom(false)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [selectedChannelId, isLoading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() && isConnected && user && selectedChannelId) {
      await sendMessage({
        type: 'message',
        data: {
          content: inputMessage,
          user_id: user.id,
          user: { username: user.username },
          channel_id: selectedChannelId
        }
      })
      setInputMessage('')
      
      // メッセージ送信後は強制的に最下部にスクロール
      setTimeout(() => {
        scrollToBottom(true)
      }, 50)
    }
  }

  const getMessageContent = (message: WebSocketMessage) => {
    if (message.type === 'welcome') {
      return message.message || 'Welcome!'
    }
    if (message.type === 'message' && message.data) {
      return message.data.content || JSON.stringify(message.data)
    }
    return JSON.stringify(message)
  }

  const getMessageUsername = (message: WebSocketMessage) => {
    if (message.type === 'message' && message.data?.user?.username) {
      return message.data.user.username
    }
    return 'System'
  }

  const getMessageTimestamp = (message: WebSocketMessage) => {
    if (message.type === 'message' && message.data?.created_at) {
      // PostgreSQLから来る時刻文字列をUTCとして明示的に扱う
      const utcTimeString = message.data.created_at.endsWith('Z') 
        ? message.data.created_at 
        : message.data.created_at + 'Z'
      
      const utcDate = new Date(utcTimeString)
      
      return utcDate.toLocaleTimeString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
    return new Date().toLocaleTimeString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return (
    <div className="flex h-screen bg-discord-darkest">
      {/* Server List */}
      <ServerList
        selectedServerId={selectedServerId}
        onServerSelect={handleServerSelect}
        onCreateServer={handleCreateServer}
      />
      
      {/* Channel List */}
      <ChannelList
        server={currentServer}
        selectedChannelId={selectedChannelId}
        onChannelSelect={handleChannelSelect}
        onCreateChannel={handleCreateChannel}
        onChannelCreated={handleChannelCreated}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-12 bg-discord-dark border-b border-discord-darker flex items-center px-4">
          {currentChannel ? (
            <>
              <HashtagIcon className="w-5 h-5 text-discord-secondary mr-2" />
              <span className="text-white font-semibold">{currentChannel.name}</span>
            </>
          ) : (
            <span className="text-discord-secondary">チャンネルを選択してください</span>
          )}
          <div className="ml-auto flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center">
              <button
                onClick={() => setShowUserSettingsModal(true)}
                className="flex items-center hover:bg-discord-secondary hover:bg-opacity-30 rounded px-2 py-1 transition-colors"
                title="ユーザー設定"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-6 h-6 rounded-full object-cover mr-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`w-6 h-6 bg-discord-blurple rounded-full flex items-center justify-center mr-2 ${user?.avatar_url ? 'hidden' : ''}`}>
                  <span className="text-white text-xs font-semibold">
                    {user?.username.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-white text-sm">{user?.username}</span>
              </button>
              <button
                onClick={logout}
                className="ml-2 p-1 text-discord-secondary hover:text-white rounded transition-colors"
                title="ログアウト"
              >
                <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
              </button>
            </div>
            {/* Connection Status */}
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-discord-green' : 'bg-discord-red'
                }`} />
              <span className="text-xs text-discord-secondary">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto discord-scrollbar p-4"
        >
          {!currentChannel ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-discord-secondary text-lg mb-2">チャンネルを選択してください</div>
                <div className="text-discord-secondary text-sm">左のサイドバーからサーバーとチャンネルを選択してください</div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-discord-secondary">メッセージを読み込み中...</div>
            </div>
          ) : (
            messages.map((message, index) => (
            <div key={index} className="flex items-start mb-4 hover:bg-discord-dark hover:bg-opacity-30 p-2 rounded">
              <div className="w-10 h-10 bg-discord-primary rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-semibold text-sm">
                  {getMessageUsername(message).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline mb-1">
                  <span className="text-white font-medium mr-2">
                    {getMessageUsername(message)}
                  </span>
                  <span className="text-discord-secondary text-xs">
                    {getMessageTimestamp(message)}
                  </span>
                </div>
                <div className="text-discord-secondary">
                  {getMessageContent(message)}
                </div>
              </div>
            </div>
          )))}
          
          {/* スクロール制御用の要素 */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4">
          <form onSubmit={handleSendMessage} className="flex">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={currentChannel ? `Message #${currentChannel.name}` : "チャンネルを選択してください"}
                className="w-full bg-discord-secondary text-white placeholder-discord-secondary rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-discord-primary"
                disabled={!isConnected || !currentChannel}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || !isConnected || !currentChannel}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-discord-secondary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Create Server Modal */}
      <CreateServerModal
        isOpen={showCreateServerModal}
        onClose={() => setShowCreateServerModal(false)}
        onServerCreated={handleServerCreated}
      />
      
      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
        server={currentServer}
        onChannelCreated={handleChannelCreated}
      />
      
      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showUserSettingsModal}
        onClose={() => setShowUserSettingsModal(false)}
      />
    </div>
  )
}