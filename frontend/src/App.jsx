import { useCallback, useEffect, useState } from 'react'
import { api } from './lib/api.js'
import AuthView from './components/AuthView.jsx'
import Dashboard from './components/Dashboard.jsx'

// user: undefined while checking the session, null when logged out.
export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    api.me().then(setUser, () => setUser(null))
  }, [])

  const onLoggedOut = useCallback(() => setUser(null), [])

  if (user === undefined) return null
  if (user === null) return <AuthView onLoggedIn={setUser} />
  return <Dashboard user={user} onLoggedOut={onLoggedOut} />
}
