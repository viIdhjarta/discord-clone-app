import { useState, useEffect } from 'react'
import { XMarkIcon, UserCircleIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { updateUser, type UpdateUserRequest } from '../api/user'
import { useAuth } from '../contexts/AuthContext'
import type { User } from '../types'

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
  const { user, updateUserInfo } = useAuth()
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // モーダルが開かれたときにユーザー情報をフォームに設定
  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username)
      setAvatarUrl(user.avatar_url || '')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    // 変更がない場合は何もしない
    if (username === user.username && avatarUrl === (user.avatar_url || '')) {
      handleClose()
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const updateData: UpdateUserRequest = {}
      
      if (username !== user.username) {
        updateData.username = username.trim()
      }
      
      if (avatarUrl !== (user.avatar_url || '')) {
        updateData.avatar_url = avatarUrl.trim()
      }

      const updatedUser = await updateUser(updateData)
      
      // AuthContextのユーザー情報を更新
      updateUserInfo(updatedUser)
      
      setSuccess(true)
      
      // 1.5秒後にモーダルを閉じる
      setTimeout(() => {
        handleClose()
      }, 1500)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (user) {
      setUsername(user.username)
      setAvatarUrl(user.avatar_url || '')
    }
    setError(null)
    setSuccess(false)
    setLoading(false)
    onClose()
  }

  const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUrl(e.target.value)
  }

  const removeAvatar = () => {
    setAvatarUrl('')
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-discord-dark rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">ユーザー設定</h2>
          <button
            onClick={handleClose}
            className="text-discord-secondary hover:text-white transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Avatar Preview */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-20 h-20 rounded-full object-cover border-4 border-discord-blurple"
                onError={() => setAvatarUrl('')}
              />
            ) : (
              <div className="w-20 h-20 bg-discord-blurple rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-12 h-12 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-discord-secondary mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名を入力"
              className="w-full bg-discord-darker text-white px-3 py-2 rounded border border-discord-secondary focus:border-discord-blurple focus:outline-none transition-colors"
              disabled={loading}
              maxLength={50}
              required
            />
            <div className="text-xs text-discord-secondary mt-1">
              3-50文字、英数字とアンダースコアのみ
            </div>
          </div>

          {/* Avatar URL */}
          <div className="mb-4">
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-discord-secondary mb-2">
              アバター画像URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                id="avatarUrl"
                value={avatarUrl}
                onChange={handleAvatarUrlChange}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 bg-discord-darker text-white px-3 py-2 rounded border border-discord-secondary focus:border-discord-blurple focus:outline-none transition-colors"
                disabled={loading}
              />
              {avatarUrl && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="px-3 py-2 bg-discord-red hover:bg-red-600 text-white rounded transition-colors"
                  disabled={loading}
                >
                  削除
                </button>
              )}
            </div>
            <div className="text-xs text-discord-secondary mt-1">
              空欄にするとデフォルトアバターが表示されます
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-discord-red bg-opacity-20 border border-discord-red rounded">
              <p className="text-discord-red text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-discord-green bg-opacity-20 border border-discord-green rounded">
              <p className="text-discord-green text-sm">ユーザー情報を更新しました！</p>
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
              disabled={loading || (username === user.username && avatarUrl === (user.avatar_url || ''))}
              className="px-4 py-2 bg-discord-blurple hover:bg-discord-blurple-hover text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '更新中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}