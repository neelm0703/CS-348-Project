// Options for the status dropdown: matching statuses split into built-in and
// custom groups, plus the name to offer for "+ Create" when nothing matches exactly.
// exactIndex is the exact match's position in [...builtIn, ...custom] (or -1),
// so Enter picks "Interview" rather than an earlier "Interviewing".
export function filterStatusOptions(statuses, query) {
  const q = query.trim()
  const needle = q.toLowerCase()
  const matches = statuses.filter((s) => s.name.toLowerCase().includes(needle))
  const builtIn = matches.filter((s) => s.is_default)
  const custom = matches.filter((s) => !s.is_default)
  const exactIndex = q ? [...builtIn, ...custom].findIndex((s) => s.name.toLowerCase() === needle) : -1
  const exact = statuses.some((s) => s.name.toLowerCase() === needle)
  return {
    builtIn,
    custom,
    createName: q && !exact ? q : null,
    exactIndex,
  }
}
