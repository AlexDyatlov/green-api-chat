import { useCallback, useState } from 'react'
import { ChatScreen } from './components/ChatScreen'
import { LoginScreen } from './components/LoginScreen'
import { clearCredentials, loadCredentials, saveCredentials } from './lib/storage'
import type { Credentials } from './types'

function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials())

  const handleConnect = useCallback((value: Credentials) => {
    saveCredentials(value)
    setCredentials(value)
  }, [])

  const handleLogout = useCallback(() => {
    clearCredentials()
    setCredentials(null)
  }, [])

  if (!credentials) {
    return <LoginScreen onConnect={handleConnect} />
  }

  return <ChatScreen credentials={credentials} onLogout={handleLogout} />
}

export default App
