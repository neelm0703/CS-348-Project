// Mirrors the backend's ApplicationCreate rules so most mistakes are caught
// before a request is sent. Returns {} when the form is valid.
export function validateApplication({ company, role, status_id, portal_url }) {
  const errors = {}
  const text = { company: 'Enter a company.', role: 'Enter a role.' }
  for (const field of ['company', 'role']) {
    const value = (field === 'company' ? company : role)?.trim() ?? ''
    if (!value) errors[field] = text[field]
    else if (value.length > 255) errors[field] = 'Keep this under 256 characters.'
  }
  if (status_id == null) errors.status_id = 'Choose a status.'
  if ((portal_url?.trim() ?? '').length > 2048) errors.portal_url = 'Keep the link under 2,049 characters.'
  return errors
}

// The PUT/POST body: every field, text trimmed, empty optional fields as null.
export function toApplicationBody({ company, role, status_id, portal_url, notes }) {
  return {
    company: company.trim(),
    role: role.trim(),
    status_id,
    portal_url: portal_url?.trim() || null,
    notes: notes?.trim() || null,
  }
}
