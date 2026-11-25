// Thin wrapper around fetch for the FastAPI backend. Every path is relative
// (/api/...) so the Vite proxy makes it same-origin and the auth cookie is sent.

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

// FastAPI sends `detail` as a string for HTTPException, or as a list of
// validation errors for 422.
function readDetail(body) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) {
    return String(detail[0].msg).replace(/^Value error, /, '')
  }
  return 'Something went wrong. Try again.'
}

function parse(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function request(method, path, body) {
  const init = { method, credentials: 'same-origin', headers: {} }
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const res = await fetch(path, init)
  const data = res.status === 204 ? null : parse(await res.text())
  if (!res.ok) throw new ApiError(res.status, readDetail(data))
  return data
}

export function buildQuery({ role, company, statuses } = {}) {
  const params = new URLSearchParams()
  if (role?.trim()) params.append('role', role.trim())
  if (company?.trim()) params.append('company', company.trim())
  for (const id of statuses ?? []) params.append('statuses', String(id))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const api = {
  me: () => request('GET', '/api/auth/me'),
  login: ({ email, password }) => request('POST', '/api/auth/login', { email, password }),
  signup: ({ name, email, password }) => request('POST', '/api/auth/signup', { name, email, password }),
  logout: () => request('POST', '/api/auth/logout'),

  // One request, so the list and the counts come from the same database snapshot
  // and always agree. Resolves to { applications, report }.
  listApplicationsWithReport: (filters) => request('GET', `/api/applications${buildQuery(filters)}`),
  createApplication: (body) => request('POST', '/api/applications', body),
  updateApplication: (id, body) => request('PUT', `/api/applications/${id}`, body),
  deleteApplication: (id) => request('DELETE', `/api/applications/${id}`),

  listStatuses: () => request('GET', '/api/statuses'),
  createStatus: (name) => request('POST', '/api/statuses', { name }),
  deleteStatus: (id) => request('DELETE', `/api/statuses/${id}`),
}
