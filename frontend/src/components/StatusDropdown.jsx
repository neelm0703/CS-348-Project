import { useEffect, useId, useRef, useState } from 'react'
import { api, ApiError } from '../lib/api.js'
import { filterStatusOptions } from '../lib/statusOptions.js'
import StatusTag from './StatusTag.jsx'

// Single-select status picker with search. If the typed name doesn't exist,
// the last option creates it straight away (POST /api/statuses) and selects it.
export default function StatusDropdown({ id, statuses, value, onChange, onCreated, onSessionExpired, invalid }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  // A just-created status isn't in `statuses` until the refetch lands.
  const [created, setCreated] = useState(null)
  const wrapRef = useRef(null)
  const triggerRef = useRef(null)
  const listId = useId()

  const { builtIn, custom, createName } = filterStatusOptions(statuses, query)
  const options = [...builtIn, ...custom]
  const total = options.length + (createName ? 1 : 0)
  const selected = statuses.find((s) => s.status_id === value) ?? (created?.status_id === value ? created : null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e) => !wrapRef.current?.contains(e.target) && close(false)
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  function openList() {
    setQuery('')
    setError(null)
    setActive(Math.max(0, statuses.findIndex((s) => s.status_id === value)))
    setOpen(true)
  }

  function close(refocus = true) {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  function choose(status) {
    onChange(status.status_id)
    close()
  }

  async function create(name) {
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const status = await api.createStatus(name)
      setCreated({ ...status, is_default: false })
      onChange(status.status_id)
      onCreated()
      close()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onSessionExpired()
      if (err instanceof ApiError && err.status === 409) setError('A status with that name already exists.')
      else if (err instanceof ApiError && err.status === 422) setError(err.detail)
      else setError("Couldn't create that status. Try again.")
    } finally {
      setCreating(false)
    }
  }

  function pick(index) {
    if (index < options.length) choose(options[index])
    else if (createName) create(createName)
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation() // close the list, not the modal
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (total ? (i + 1) % total : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (total ? (i - 1 + total) % total : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault() // don't submit the form
      if (total) pick(Math.min(active, total - 1))
    } else if (e.key === 'Tab') {
      close(false)
    }
  }

  const optionId = (i) => `${listId}-opt-${i}`
  const renderOption = (s, i) => (
    <div key={s.status_id} id={optionId(i)} role="option" aria-selected={s.status_id === value}
      className={`opt${i === active ? ' active' : ''}`}
      onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(s)}>
      <StatusTag status={s} />
      {s.status_id === value && <span className="check" aria-hidden="true">✓</span>}
    </div>
  )

  return (
    <div className="dropdown-wrap" ref={wrapRef} onKeyDown={open ? onKeyDown : undefined}>
      <button ref={triggerRef} id={id} type="button" className={`select select-full${invalid ? ' error' : ''}`}
        aria-haspopup="listbox" aria-expanded={open} onClick={() => (open ? close() : openList())}>
        {selected ? <StatusTag status={selected} /> : <span className="ph">Choose a status</span>}
        <span className="chev" aria-hidden="true" />
      </button>
      {open && (
        <div className="dropdown status-list">
          <input className="search" autoFocus placeholder="Find or create a status" aria-label="Find or create a status"
            role="combobox" aria-expanded="true" aria-controls={listId}
            aria-activedescendant={total ? optionId(Math.min(active, total - 1)) : undefined}
            value={query} onChange={(e) => {
              setQuery(e.target.value)
              setActive(Math.max(0, filterStatusOptions(statuses, e.target.value).exactIndex))
              setError(null)
            }} />
          <div id={listId} role="listbox" aria-label="Statuses" className="opt-scroll">
            {builtIn.map((s, i) => renderOption(s, i))}
            {custom.length > 0 && <div className="opt-group" role="presentation">Your statuses</div>}
            {custom.map((s, i) => renderOption(s, builtIn.length + i))}
            {options.length === 0 && <div className="opt-empty">No status called "{query.trim()}"</div>}
            {createName && (
              <div id={optionId(options.length)} role="option" aria-selected="false"
                className={`opt create${active === options.length ? ' active' : ''}`}
                onMouseEnter={() => setActive(options.length)} onMouseDown={(e) => e.preventDefault()}
                onClick={() => create(createName)}>
                {creating ? 'Creating…' : `+ Create "${createName}"`}
              </div>
            )}
          </div>
          {error && <div className="field-error dropdown-error" role="alert">{error}</div>}
        </div>
      )}
    </div>
  )
}
