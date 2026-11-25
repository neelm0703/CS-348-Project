import { api } from '../lib/api.js'

export default function TopBar({ user, onLoggedOut }) {
  async function logOut() {
    try {
      await api.logout()
    } finally {
      onLoggedOut()
    }
  }

  return (
    <header className="topbar">
      <div className="brand"><span className="mark" aria-hidden="true" />ApplicationBoard</div>
      <div className="user">
        <span className="avatar" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
        <span className="user-name">{user.name}</span>
        <span className="sep" aria-hidden="true" />
        <button type="button" className="linkbtn" onClick={logOut}>Log out</button>
      </div>
    </header>
  )
}
