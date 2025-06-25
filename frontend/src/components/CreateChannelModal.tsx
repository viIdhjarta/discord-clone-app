import { useState } from 'react'
import { XMarkIcon, HashtagIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline'
import { createChannel } from '../api/servers'
import type { Channel, Server } from '../types'

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  server: Server | null
  onChannelCreated: (channel: Channel) => void
}

export const CreateChannelModal = ({ isOpen, onClose, server, onChannelCreated }: CreateChannelModalProps) => {
  const [channelName, setChannelName] = useState('')
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!server) return
    
    if (!channelName.trim()) {
      setError('チャンネル名を入力してください')
      return
    }

    if (channelName.length > 100) {
      setError('チャンネル名は100文字以下にしてください')
      return
    }

    // チャンネル名の形式チェック
    const channelNameRegex = /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]+$/
    if (!channelNameRegex.test(channelName.trim())) {
      setError('チャンネル名に使用できない文字が含まれています')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newChannel = await createChannel(server.id, channelName.trim(), channelType)
      onChannelCreated(newChannel)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'チャンネルの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setChannelName('')
    setChannelType('text')
    setError(null)
    setLoading(false)
    onClose()
  }

  if (!isOpen || !server) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-discord-dark rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">チャンネルを作成</h2>
          <button
            onClick={handleClose}
            className="text-discord-secondary hover:text-white transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Server Name */}
        <div className="mb-4 text-sm text-discord-secondary">
          サーバー: <span className="text-white font-medium">{server.name}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Channel Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-discord-secondary mb-3">
              チャンネルタイプ
            </label>
            <div className="space-y-2">
              <div 
                onClick={() => setChannelType('text')}
                className={`flex items-center p-3 rounded cursor-pointer transition-colors ${
                  channelType === 'text' 
                    ? 'bg-discord-blurple bg-opacity-20 border border-discord-blurple' 
                    : 'bg-discord-darker border border-discord-secondary hover:border-discord-blurple'
                }`}
              >
                <HashtagIcon className="w-5 h-5 text-discord-secondary mr-3" />
                <div>
                  <div className="text-white font-medium">テキスト</div>
                  <div className="text-discord-secondary text-xs">テキストメッセージを送信</div>
                </div>
              </div>
              
              <div 
                onClick={() => setChannelType('voice')}
                className={`flex items-center p-3 rounded cursor-pointer transition-colors ${
                  channelType === 'voice' 
                    ? 'bg-discord-blurple bg-opacity-20 border border-discord-blurple' 
                    : 'bg-discord-darker border border-discord-secondary hover:border-discord-blurple'
                }`}
              >
                <SpeakerWaveIcon className="w-5 h-5 text-discord-secondary mr-3" />
                <div>
                  <div className="text-white font-medium">ボイス</div>
                  <div className="text-discord-secondary text-xs">音声で会話する</div>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Name */}
          <div className="mb-4">
            <label htmlFor="channelName" className="block text-sm font-medium text-discord-secondary mb-2">
              チャンネル名
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {channelType === 'text' ? (
                  <HashtagIcon className="w-4 h-4 text-discord-secondary" />
                ) : (
                  <SpeakerWaveIcon className="w-4 h-4 text-discord-secondary" />
                )}
              </div>
              <input
                type="text"
                id="channelName"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="新しいチャンネル"
                className="w-full bg-discord-darker text-white pl-10 pr-3 py-2 rounded border border-discord-secondary focus:border-discord-blurple focus:outline-none transition-colors"
                disabled={loading}
                maxLength={100}
              />
            </div>
            <div className="text-xs text-discord-secondary mt-1">
              {channelName.length}/100文字（英数字、日本語、ハイフン、アンダースコアのみ）
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
              disabled={loading || !channelName.trim()}
              className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '作成中...' : 'チャンネルを作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}