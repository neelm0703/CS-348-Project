import { useRef, useState } from 'react'
import { api, ApiError } from '../lib/api.js'
import { toApplicationBody, validateApplication } from '../lib/validate.js'
import { CloseButton } from './Modal.jsx'
import StatusDropdown from './StatusDropdown.jsx'

function initialForm(mode, application, statuses) {
  if (mode === 'edit') {
    return {
      company: application.company,
      role: application.role,
      status_id: application.status_id,
      portal_url: application.portal_url ?? '',
      notes: application.notes ?? '',
    }
  }
  // Found by name, not ID, so it doesn't depend on seeding order.
  const applied = statuses.find((s) => s.is_default && s.name === 'Applied')
  return { company: '', role: '', status_id: applied?.status_id ?? null, portal_url: '', notes: '' }
}

function errorMessage(err) {
  if (!(err instanceof ApiError)) return 'Something went wrong. Try again.'
  if (err.status === 404 && /status/i.test(err.detail)) return 'That status no longer exists. Choose another one.'
  if (err.status === 404) return 'This application no longer exists.'
  if (err.status === 422) return err.detail
  return 'Something went wrong. Try again.'
}

// Screens 5 (create) and 6 (edit). Edit sends every field (PUT).
export default function ApplicationFormModal({ mode, application, statuses, onClose, onCancel, onSaved, onStatusesChanged, onSessionExpired }) {
  const [form, setForm] = useState(() => initialForm(mode, application, statuses))
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const isEdit = mode === 'edit'

  function update(field, value) {
    const next = { ...form, [field]: value }
    setForm(next)
    if (submitted) setErrors(validateApplication(next))
  }

  async function submit(e) {
    e.preventDefault()
    if (pendingRef.current) return // guards a fast double click before the button disables
    setSubmitted(true)
    const found = validateApplication(form)
    setErrors(found)
    if (Object.keys(found).length) return
    pendingRef.current = true
    setPending(true)
    setServerError(null)
    try {
      const body = toApplicationBody(form)
      if (isEdit) await api.updateApplication(application.application_id, body)
      else await api.createApplication(body)
      onSaved()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onSessionExpired()
      setServerError(errorMessage(err))
      pendingRef.current = false
      setPending(false)
    }
  }

  const text = (field, label, props = {}) => (
    <div className="field">
      <label className="lbl" htmlFor={`f-${field}`}>{label}</label>
      <input id={`f-${field}`} className={`input${errors[field] ? ' error' : ''}`} value={form[field]}
        onChange={(e) => update(field, e.target.value)} aria-invalid={Boolean(errors[field])}
        aria-describedby={errors[field] ? `f-${field}-error` : undefined} {...props} />
      {errors[field] && <div className="field-error" id={`f-${field}-error`}>{errors[field]}</div>}
    </div>
  )

  return (
    <form onSubmit={submit} noValidate>
      <div className="modal-head">
        <h2 id="modal-title">{isEdit ? 'Edit application' : 'New application'}</h2>
        <CloseButton onClick={onClose} />
      </div>
      <div className="modal-body">
        <div className="row2">
          {text('company', 'Company', { 'data-autofocus': true, autoComplete: 'organization' })}
          {text('role', 'Role', { autoComplete: 'off' })}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="f-status">Status</label>
          <StatusDropdown id="f-status" statuses={statuses} value={form.status_id} invalid={Boolean(errors.status_id)}
            onChange={(id) => update('status_id', id)} onCreated={onStatusesChanged} onSessionExpired={onSessionExpired} />
          {errors.status_id && <div className="field-error">{errors.status_id}</div>}
        </div>
        {text('portal_url', <>Portal link <span className="opt-note">(optional)</span></>, { type: 'url', placeholder: 'https://', inputMode: 'url' })}
        <div className="field field-last">
          <label className="lbl" htmlFor="f-notes">Notes <span className="opt-note">(optional)</span></label>
          <textarea id="f-notes" className="input" placeholder="Referrals, deadlines, who you spoke to"
            value={form.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        {serverError && <div className="alert modal-alert" role="alert">{serverError}</div>}
      </div>
      <div className="modal-foot">
        <div className="right">
          <button type="button" className="btn" onClick={isEdit ? onCancel : onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {isEdit ? 'Save changes' : 'Create application'}
          </button>
        </div>
      </div>
    </form>
  )
}
