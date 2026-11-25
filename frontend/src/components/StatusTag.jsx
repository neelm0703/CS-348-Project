import { statusColor } from '../lib/statusColors.js'

// status needs status_id, name and is_default. count is optional.
export default function StatusTag({ status, count }) {
  const { text, tint } = statusColor(status)
  return (
    <span className="tag" style={{ color: text, background: tint }} title={status.name}>
      {status.name}
      {count !== undefined && <b>{count}</b>}
    </span>
  )
}
