import { useState, useEffect } from 'react'
import { HashtagIcon, SpeakerWaveIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { Channel, Server } from '../types'
import { getServerChannels } from '../api/servers'

interface ChannelListProps {
  server: Server | null
  selectedChannelId: number | null
  onChannelSelect: (channelId: number) => void
  onCreateChannel: () => void
  onChannelCreated?: (channel: Channel) => void
}

export const ChannelList = ({ server, selectedChannelId, onChannelSelect, onCreateChannel, onChannelCreated }: ChannelListProps) => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // チャンネル一覧を更新する関数
  const refreshChannels = async () => {
    if (!server) return

    try {
      const serverChannels = await getServerChannels(server.id)
      setChannels(serverChannels)
    } catch (err) {
      console.error('Failed to refresh channels:', err)
    }
  }

  // 新しいチャンネルを一覧に追加
  const addChannel = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel])
    if (onChannelCreated) {
      onChannelCreated(newChannel)
    }
  }

  // 外部からチャンネル追加を受け取る（propsから呼び出される場合）
  const handleChannelCreated = (channel: Channel) => {
    addChannel(channel)
  }

  useEffect(() => {
    const fetchChannels = async () => {
      if (!server) {
        setChannels([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const serverChannels = await getServerChannels(server.id)
        setChannels(serverChannels)
        
        // 初回ロード時にデフォルトチャンネル（general）を選択
        if (serverChannels.length > 0 && !selectedChannelId) {
          const generalChannel = serverChannels.find(ch => ch.name === 'general') || serverChannels[0]
          onChannelSelect(generalChannel.id)
        }
      } catch (err) {
        setError('チャンネルの取得に失敗しました')
        console.error('Failed to fetch channels:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
  }, [server, selectedChannelId, onChannelSelect])

  const getChannelIcon = (type: Channel['type']) => {
    switch (type) {
      case 'voice':
        return <SpeakerWaveIcon className="w-4 h-4" />
      case 'text':
      default:
        return <HashtagIcon className="w-4 h-4" />
    }
  }

  if (!server) {
    return (
      <div className="w-60 bg-discord-darker flex items-center justify-center">
        <p className="text-discord-secondary text-sm">サーバーを選択してください</p>
      </div>
    )
  }

  return (
    <div className="w-60 bg-discord-darker flex flex-col">
      {/* Server Header */}
      <div className="p-4 border-b border-discord-dark">
        <h1 className="text-white font-semibold truncate" title={server.name}>
          {server.name}
        </h1>
        {server.role && (
          <p className="text-xs text-discord-secondary capitalize">
            {server.role === 'owner' ? '所有者' : server.role === 'admin' ? '管理者' : 'メンバー'}
          </p>
        )}
      </div>

      {/* Channels */}
      <div className="flex-1 p-2 overflow-y-auto">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-discord-dark animate-pulse rounded"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-2 text-discord-red text-sm">
            {error}
          </div>
        ) : (
          <>
            {/* Text Channels Section */}
            {(channels.filter(ch => ch.type === 'text').length > 0 || server?.role === 'owner' || server?.role === 'admin') && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-discord-secondary text-xs uppercase font-semibold mb-2 px-1 group">
                  <span>テキストチャンネル</span>
                  {(server?.role === 'owner' || server?.role === 'admin') && (
                    <button
                      onClick={onCreateChannel}
                      className="opacity-0 group-hover:opacity-100 hover:text-white transition-all duration-200 p-1 rounded hover:bg-discord-dark"
                      title="チャンネルを作成"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {channels
                    .filter(ch => ch.type === 'text')
                    .map((channel) => (
                      <div
                        key={channel.id}
                        onClick={() => onChannelSelect(channel.id)}
                        className={`
                          flex items-center px-2 py-1 rounded cursor-pointer transition-colors
                          ${selectedChannelId === channel.id
                            ? 'bg-discord-secondary text-white'
                            : 'text-discord-secondary hover:text-white hover:bg-discord-dark'
                          }
                        `}
                      >
                        {getChannelIcon(channel.type)}
                        <span className="ml-2 truncate">{channel.name}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Voice Channels Section */}
            {channels.filter(ch => ch.type === 'voice').length > 0 && (
              <div className="mb-4">
                <div className="text-discord-secondary text-xs uppercase font-semibold mb-2 px-1">
                  ボイスチャンネル
                </div>
                <div className="space-y-1">
                  {channels
                    .filter(ch => ch.type === 'voice')
                    .map((channel) => (
                      <div
                        key={channel.id}
                        onClick={() => onChannelSelect(channel.id)}
                        className={`
                          flex items-center px-2 py-1 rounded cursor-pointer transition-colors
                          ${selectedChannelId === channel.id
                            ? 'bg-discord-secondary text-white'
                            : 'text-discord-secondary hover:text-white hover:bg-discord-dark'
                          }
                        `}
                      >
                        {getChannelIcon(channel.type)}
                        <span className="ml-2 truncate">{channel.name}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {channels.length === 0 && (
              <div className="p-2 text-discord-secondary text-sm">
                チャンネルがありません
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}