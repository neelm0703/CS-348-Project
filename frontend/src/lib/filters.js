export const EMPTY_FILTERS = { role: '', company: '', statuses: [] }

export function hasFilters({ role, company, statuses }) {
  return Boolean(role?.trim() || company?.trim() || statuses?.length)
}

function joinOr(names) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`
}

// One-line summary for the "Nothing matches these filters" state, e.g.
// 'Role starts with "quant", status is Offer or Onsite.'
export function describeFilters({ role, company, statuses: ids }, statuses) {
  const parts = []
  if (role?.trim()) parts.push(`role starts with "${role.trim()}"`)
  if (company?.trim()) parts.push(`company starts with "${company.trim()}"`)
  const names = (ids ?? [])
    .map((id) => statuses.find((s) => s.status_id === id)?.name)
    .filter(Boolean)
  if (names.length) parts.push(`status is ${joinOr(names)}`)
  const text = parts.join(', ')
  return text ? `${text[0].toUpperCase()}${text.slice(1)}.` : ''
}
