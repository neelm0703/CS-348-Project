import { useState } from 'react'
import { api, ApiError } from '../lib/api.js'

const COPY = {
  login: {
    title: 'Log in',
    intro: 'Pick up where you left off with your applications.',
    submit: 'Log in',
    switchText: 'New here?',
    switchLink: 'Create an account',
  },
  signup: {
    title: 'Create an account',
    intro: 'Track every application and where it stands.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLink: 'Log in',
  },
}

function errorMessage(err, mode) {
  if (!(err instanceof ApiError)) return 'Something went wrong. Try again.'
  if (err.status === 401 && mode === 'login') return 'Email or password is incorrect.'
  if (err.status === 409) return 'An account with this email already exists.'
  if (err.status === 422) return err.detail
  return 'Something went wrong. Try again.'
}

export default function AuthView({ onLoggedIn }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const copy = COPY[mode]

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError(null)
  }

  async function submit(e) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      if (mode === 'login') await api.login({ email: form.email, password: form.password })
      else await api.signup(form)
      onLoggedIn(await api.me())
    } catch (err) {
      setError(errorMessage(err, mode))
      setPending(false)
    }
  }

  const invalid = Boolean(error)
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand"><span className="mark" aria-hidden="true" />ApplicationBoard</div>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <form className="auth-box" onSubmit={submit} noValidate>
          {error && <div className="alert" role="alert">{error}</div>}
          {mode === 'signup' && (
            <div className="field">
              <label className="lbl" htmlFor="auth-name">Name</label>
              <input id="auth-name" className="input" autoComplete="name" required
                value={form.name} onChange={set('name')} />
            </div>
          )}
          <div className="field">
            <label className="lbl" htmlFor="auth-email">Email</label>
            <input id="auth-email" className={`input${invalid ? ' error' : ''}`} type="email"
              autoComplete="email" required value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label className="lbl" htmlFor="auth-password">Password</label>
            <input id="auth-password" className={`input${invalid ? ' error' : ''}`} type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required
              placeholder={mode === 'signup' ? 'At least 8 characters' : undefined}
              value={form.password} onChange={set('password')} />
            {mode === 'signup' && <div className="hint">Use 8 to 128 characters.</div>}
          </div>
          <button className="btn btn-primary" type="submit" disabled={pending}>{copy.submit}</button>
        </form>
        <div className="switch">
          {copy.switchText} <button type="button" className="textlink" onClick={switchMode}>{copy.switchLink}</button>
        </div>
      </div>
    </main>
  )
}
