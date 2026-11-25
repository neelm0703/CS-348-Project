import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Backdrop plus dialog. Esc and a backdrop click call onClose. Focus moves
// into the dialog, stays inside it, and returns to where it was on close.
// contentKey: change it when the dialog swaps content (details -> edit) to
// move focus into the new content.
export default function Modal({ onClose, labelledBy, contentKey, children }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const opener = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    const target = dialog.querySelector('[data-autofocus]') ?? dialog.querySelector(FOCUSABLE) ?? dialog
    target.focus()
  }, [contentKey])

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onCloseRef.current()
      return
    }
    if (e.key !== 'Tab') return
    const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        tabIndex={-1} onKeyDown={onKeyDown}>
        {children}
      </div>
    </div>
  )
}

export function CloseButton({ onClick }) {
  return (
    <button type="button" className="close" aria-label="Close" onClick={onClick}>×</button>
  )
}
