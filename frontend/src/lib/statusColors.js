// There is no colour column in the database, so built-in statuses are coloured
// by name and custom ones by status_id, which keeps each colour stable.

const BUILT_IN = {
  Applied: { text: '#5F656B', tint: '#ECEEF0' },
  OA: { text: '#2B5D86', tint: '#E2ECF5' },
  Interviewing: { text: '#84650E', tint: '#F6EDD3' },
  Offer: { text: '#2D6843', tint: '#E1EEE5' },
  Accepted: { text: '#1C5532', tint: '#D2E7D9' },
  Rejected: { text: '#963A30', tint: '#F5E3E0' },
  Withdrawn: { text: '#765843', tint: '#EEE6DF' },
}

const CUSTOM = [
  { text: '#8B5226', tint: '#F4E6DA' },
  { text: '#3F5F63', tint: '#E1ECEC' },
  { text: '#7A4A52', tint: '#F2E5E7' },
  { text: '#6B5A1E', tint: '#F1ECD9' },
  { text: '#2F5C77', tint: '#E0EBF1' },
]

export function statusColor({ status_id, name, is_default }) {
  if (is_default && BUILT_IN[name]) return BUILT_IN[name]
  return CUSTOM[status_id % CUSTOM.length]
}

// List and report rows don't say whether a status is built-in, so look it up.
export function withDefaultFlag(statuses, status_id, name) {
  const match = statuses.find((s) => s.status_id === status_id)
  return { status_id, name, is_default: match ? match.is_default : false }
}
