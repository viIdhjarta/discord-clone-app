import { ChatInterface } from './components/ChatInterface'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './components/AuthPage'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    )
  }

  return user ? <ChatInterface /> : <AuthPage />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App