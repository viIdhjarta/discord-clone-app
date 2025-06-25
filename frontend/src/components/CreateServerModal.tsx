import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createServer } from '../api/servers'
import type { Server } from '../types'

interface CreateServerModalProps {
  isOpen: boolean
  onClose: () => void
  onServerCreated: (server: Server) => void
}

export const CreateServerModal = ({ isOpen, onClose, onServerCreated }: CreateServerModalProps) => {
  const [serverName, setServerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!serverName.trim()) {
      setError('サーバー名を入力してください')
      return
    }

    if (serverName.length > 100) {
      setError('サーバー名は100文字以下にしてください')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newServer = await createServer(serverName.trim())
      onServerCreated(newServer)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サーバーの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setServerName('')
    setError(null)
    setLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-discord-dark rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">サーバーを作成</h2>
          <button
            onClick={handleClose}
            className="text-discord-secondary hover:text-white transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="serverName" className="block text-sm font-medium text-discord-secondary mb-2">
              サーバー名
            </label>
            <input
              type="text"
              id="serverName"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="新しいサーバー"
              className="w-full bg-discord-darker text-white px-3 py-2 rounded border border-discord-secondary focus:border-discord-blurple focus:outline-none transition-colors"
              disabled={loading}
              maxLength={100}
            />
            <div className="text-xs text-discord-secondary mt-1">
              {serverName.length}/100
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-discord-red bg-opacity-20 border border-discord-red rounded">
              <p className="text-discord-red text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-discord-secondary hover:text-white transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !serverName.trim()}
              className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '作成中...' : 'サーバーを作成'}
            </button>
          </div>
        </form>

        {/* Info Text */}
        <div className="mt-4 text-xs text-discord-secondary">
          <p>サーバーを作成すると、あなたが管理者になります。後でメンバーを招待することができます。</p>
        </div>
      </div>
    </div>
  )
}