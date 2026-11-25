import { useState } from 'react'
import { api, ApiError } from '../lib/api.js'
import StatusTag from './StatusTag.jsx'

function LockIcon() {
  return (
    <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// Replaces the counts panel. Every add or delete saves at once and refetches.
export default function EditStatusesPanel({ statuses, onDone, onChanged, onSessionExpired }) {
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)

  const builtIn = statuses.filter((s) => s.is_default)
  const custom = statuses.filter((s) => !s.is_default)

  function fail(err, conflictMessage, fallback) {
    if (err instanceof ApiError && err.status === 401) return onSessionExpired()
    if (err instanceof ApiError && err.status === 409) setError(conflictMessage)
    else if (err instanceof ApiError && err.status === 422) setError(err.detail)
    else setError(fallback)
  }

  async function add(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || adding) return
    setAdding(true)
    setError(null)
    try {
      await api.createStatus(trimmed)
      setName('')
      await onChanged()
    } catch (err) {
      fail(err, 'A status with that name already exists.', "Couldn't add that status. Try again.")
    } finally {
      setAdding(false)
    }
  }

  async function remove(status) {
    if (deleting) return
    setDeleting(status.status_id)
    setError(null)
    try {
      await api.deleteStatus(status.status_id)
      await onChanged()
      document.getElementById('new-status')?.focus() // the clicked cell is gone
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) await onChanged() // already gone
      else fail(err, 'This status is still used by an application.', "Couldn't delete that status. Try again.")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section className="panel edit-panel" aria-labelledby="edit-statuses-title">
      <div className="edit-head">
        <div>
          <h2 id="edit-statuses-title">Edit statuses</h2>
          <p>Changes save straight away.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onDone} autoFocus>Done</button>
      </div>

      <div className="builtin">
        <span className="builtin-label"><LockIcon /><span><b>Built-in</b>, can't be deleted:</span></span>
        {builtIn.map((s) => <StatusTag key={s.status_id} status={s} />)}
      </div>

      <div className="edit-section">
        <div className="section-head">
          <div>
            <h3>Your statuses</h3>
            <p>You can delete a status once no application uses it.</p>
          </div>
          <form className="add" onSubmit={add}>
            <label className="sr-only" htmlFor="new-status">New status name</label>
            <input id="new-status" className="input" placeholder="New status name" maxLength={50}
              value={name} onChange={(e) => { setName(e.target.value); setError(null) }} />
            <button type="submit" className="btn" disabled={adding || !name.trim()}>Add status</button>
          </form>
        </div>

        {error && <div className="alert" role="alert">{error}</div>}

        {custom.length === 0 ? (
          <p className="no-custom">No statuses of your own yet.</p>
        ) : (
          <ul className="status-grid">
            {custom.map((s) => {
              const inUse = s.count > 0
              const usageId = `usage-${s.status_id}`
              return (
                <li key={s.status_id} className="cell">
                  <span className="cell-info">
                    <StatusTag status={s} />
                    <span className="uses" id={usageId}>{inUse ? `In use by ${s.count}` : 'Not used'}</span>
                  </span>
                  <button type="button" className="del" disabled={inUse || deleting === s.status_id}
                    aria-label={`Delete ${s.name}`} aria-describedby={usageId}
                    title={inUse ? 'Move its applications to another status first' : undefined}
                    onClick={() => remove(s)}>
                    <TrashIcon />Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
