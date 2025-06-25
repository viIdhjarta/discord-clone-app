import { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import type { Server } from '../types'
import { getUserServers } from '../api/servers'

interface ServerListProps {
  selectedServerId: number | null
  onServerSelect: (serverId: number) => void
  onCreateServer: () => void
}

export const ServerList = ({ selectedServerId, onServerSelect, onCreateServer }: ServerListProps) => {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const userServers = await getUserServers()
        setServers(userServers)
        
        // 初回ロード時に最初のサーバーを自動選択
        if (userServers.length > 0 && !selectedServerId) {
          onServerSelect(userServers[0].id)
        }
      } catch (err) {
        setError('サーバーの取得に失敗しました')
        console.error('Failed to fetch servers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchServers()
  }, [selectedServerId, onServerSelect])

  const refreshServers = async () => {
    try {
      const userServers = await getUserServers()
      setServers(userServers)
    } catch (err) {
      console.error('Failed to refresh servers:', err)
    }
  }

  // 新しいサーバーが作成された時に一覧を更新する関数をpropsに追加する必要がある場合
  useEffect(() => {
    // TODO: WebSocketでリアルタイム更新を実装する場合はここに追加
  }, [])

  if (loading) {
    return (
      <div className="w-16 bg-discord-darkest flex flex-col items-center py-3">
        <div className="w-12 h-12 bg-discord-darker rounded-full animate-pulse"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-16 bg-discord-darkest flex flex-col items-center py-3">
        <div className="w-12 h-12 bg-discord-red rounded-full flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-16 bg-discord-darkest flex flex-col items-center py-3 space-y-2">
      {servers.map((server) => (
        <div
          key={server.id}
          onClick={() => onServerSelect(server.id)}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center cursor-pointer
            transition-all duration-200 hover:rounded-2xl relative
            ${selectedServerId === server.id 
              ? 'bg-discord-blurple rounded-2xl' 
              : 'bg-discord-darker hover:bg-discord-blurple'
            }
          `}
        >
          {server.icon_url ? (
            <img
              src={server.icon_url}
              alt={server.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-lg">
              {server.name.charAt(0).toUpperCase()}
            </span>
          )}
          
          {/* アクティブ状態のインジケーター */}
          {selectedServerId === server.id && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1 h-8 bg-white rounded-r-full"></div>
          )}
          
          {/* ホバー時のツールチップ（後で実装予定） */}
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-discord-dark text-white px-2 py-1 rounded text-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            {server.name}
          </div>
        </div>
      ))}
      
      {/* サーバー作成ボタン */}
      <div
        onClick={onCreateServer}
        className="w-12 h-12 bg-discord-darker hover:bg-discord-green rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:rounded-2xl mt-2"
      >
        <PlusIcon className="w-6 h-6 text-discord-green hover:text-white" />
      </div>
    </div>
  )
}

// サーバー一覧を外部から更新するためのコンテキストやカスタムフックを後で追加予定