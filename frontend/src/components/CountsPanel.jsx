import StatusTag from './StatusTag.jsx'
import { withDefaultFlag } from '../lib/statusColors.js'

// focusEdit: put focus back on "Edit statuses" after leaving edit mode.
export default function CountsPanel({ report, statuses, onEdit, focusEdit }) {
  return (
    <section className="panel counts" aria-label="Applications by status">
      {report.map((row) => (
        <StatusTag key={row.status_id} status={withDefaultFlag(statuses, row.status_id, row.name)} count={row.count} />
      ))}
      <span className="grow" />
      <button type="button" className="linkbtn" onClick={onEdit} autoFocus={focusEdit}>
        <span aria-hidden="true">✎</span> Edit statuses
      </button>
    </section>
  )
}
