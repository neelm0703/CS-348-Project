import { useEffect, useRef, useState } from 'react'
import StatusTag from './StatusTag.jsx'

// Checkbox list of every visible status. Only picks statuses; it never creates them.
export default function StatusMultiSelect({ statuses, value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle(id) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const label = value.length === 0 ? 'All statuses' : value.length === 1 ? '1 status' : `${value.length} statuses`

  return (
    <div className="multi" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="select"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value.length ? '' : 'ph'}>{label}</span>
        <span className="chev" aria-hidden="true" />
      </button>
      {open && (
        <div className="dropdown multi-list" role="group" aria-label="Statuses">
          {statuses.map((s) => (
            <label key={s.status_id} className="opt check-opt">
              <input type="checkbox" checked={value.includes(s.status_id)} onChange={() => toggle(s.status_id)} />
              <StatusTag status={s} />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
