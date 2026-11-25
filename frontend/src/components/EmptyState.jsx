export default function EmptyState({ variant, summary, onCreate, onClear }) {
  if (variant === 'filtered') {
    return (
      <div className="empty">
        <h3>Nothing matches these filters</h3>
        <p>{summary}</p>
        <button type="button" className="btn" onClick={onClear}>Clear filters</button>
      </div>
    )
  }
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true" />
      <h3>No applications yet</h3>
      <p>Add the first job you've applied to and it will show up here.</p>
      <button type="button" className="btn btn-primary" onClick={onCreate}>+ New application</button>
    </div>
  )
}
