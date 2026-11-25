// Portal links are free text, so only http(s) becomes a clickable link.
// Anything with another scheme (javascript:, data:, ...) returns null and is
// shown as plain text instead.
export function safeHref(url) {
  const value = url?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null
  return `https://${value}`
}
