import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../lib/api.js'
import { safeHref } from '../lib/links.js'
import { CloseButton } from './Modal.jsx'
import StatusTag from './StatusTag.jsx'
import { withDefaultFlag } from '../lib/statusColors.js'

// Shows the row the dashboard already has; no extra request.
export default function DetailsModal({ application: a, statuses, onClose, onEdit, onDeleted, onSessionExpired }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const cancelRef = useRef(null)
  const deleteRef = useRef(null)
  const wasConfirming = useRef(confirming)

  // The confirmation bar replaces the footer, so move focus with it.
  useEffect(() => {
    if (wasConfirming.current === confirming) return
    wasConfirming.current = confirming
    ;(confirming ? cancelRef : deleteRef).current?.focus()
  }, [confirming])

  async function confirmDelete() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await api.deleteApplication(a.application_id)
      onDeleted()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onSessionExpired()
      if (err instanceof ApiError && err.status === 404) return onDeleted() // already gone
      setError("Couldn't delete this application. Try again.")
      setPending(false)
    }
  }

  return (
    <>
      <div className="modal-head">
        <div className="modal-head-main">
          <span className="mono mono-lg" aria-hidden="true">{a.company.charAt(0).toUpperCase()}</span>
          <div className="modal-head-text">
            <h2 id="modal-title">{a.company}</h2>
            <p>{a.role}</p>
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div className="modal-body">
        <dl className="detail-grid">
          <dt>Status</dt>
          <dd><StatusTag status={withDefaultFlag(statuses, a.status_id, a.status)} /></dd>
          <dt>Portal</dt>
          <dd>
            {!a.portal_url && <span className="none">None</span>}
            {a.portal_url && (safeHref(a.portal_url)
              ? <a href={safeHref(a.portal_url)} target="_blank" rel="noopener noreferrer">{a.portal_url}</a>
              : <span className="plain-link">{a.portal_url}</span>)}
          </dd>
          <dt>Notes</dt>
          <dd className={a.notes ? 'notes' : 'none'}>{a.notes || 'None'}</dd>
        </dl>
        {error && <div className="alert modal-alert" role="alert">{error}</div>}
      </div>
      {confirming ? (
        <div className="confirm">
          <span>Delete this application? This can't be undone.</span>
          <span className="confirm-actions">
            <button ref={cancelRef} type="button" className="btn" onClick={() => setConfirming(false)} disabled={pending}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={pending}>Delete</button>
          </span>
        </div>
      ) : (
        <div className="modal-foot">
          <button ref={deleteRef} type="button" className="btn btn-danger-text" onClick={() => setConfirming(true)}>Delete</button>
          <div className="right">
            <button type="button" className="btn" onClick={onClose}>Close</button>
            <button type="button" className="btn btn-primary" onClick={onEdit}>Edit</button>
          </div>
        </div>
      )}
    </>
  )
}
