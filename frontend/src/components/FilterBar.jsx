import { useEffect, useState } from 'react'
import StatusMultiSelect from './StatusMultiSelect.jsx'
import { EMPTY_FILTERS } from '../lib/filters.js'

// Edits a draft; nothing is fetched until Apply (or Enter in a text field).
export default function FilterBar({ statuses, applied, onApply, onClear }) {
  const [draft, setDraft] = useState(applied)

  // Keep the draft in step when the applied filters change from outside
  // (Clear in the empty state, or a deleted status being dropped).
  useEffect(() => setDraft(applied), [applied])

  function submit(e) {
    e.preventDefault()
    onApply({ ...draft, role: draft.role.trim(), company: draft.company.trim() })
  }

  return (
    <form className="toolbar" onSubmit={submit} role="search">
      <label className="sr-only" htmlFor="filter-role">Role starts with</label>
      <input id="filter-role" className="input" placeholder="Role starts with…"
        value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
      <label className="sr-only" htmlFor="filter-company">Company starts with</label>
      <input id="filter-company" className="input" placeholder="Company starts with…"
        value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
      <StatusMultiSelect statuses={statuses} value={draft.statuses}
        onChange={(ids) => setDraft({ ...draft, statuses: ids })} />
      <div className="toolbar-actions">
        <button type="submit" className="btn btn-primary">Apply</button>
        <button type="button" className="btn btn-ghost" onClick={() => { setDraft(EMPTY_FILTERS); onClear() }}>Clear</button>
      </div>
    </form>
  )
}
