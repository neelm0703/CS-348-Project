import { afterEach, describe, expect, test, vi } from 'vitest'
import { ApiError, buildQuery, request } from './api.js'

function mockFetch(status, text) {
  const fn = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  }))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('buildQuery', () => {
  test('skips empty values and repeats statuses', () => {
    expect(buildQuery({})).toBe('')
    expect(buildQuery({ role: '  ', company: '', statuses: [] })).toBe('')
    expect(buildQuery({ role: 'sw', statuses: [1, 3] })).toBe('?role=sw&statuses=1&statuses=3')
  })

  test('encodes special characters', () => {
    expect(buildQuery({ company: 'AT&T 50%_x' })).toBe('?company=AT%26T+50%25_x')
  })
})

describe('request', () => {
  test('returns null for 204 and for an empty body', async () => {
    mockFetch(204, '')
    expect(await request('POST', '/api/auth/logout')).toBeNull()
    mockFetch(200, '')
    expect(await request('GET', '/api/x')).toBeNull()
    mockFetch(200, 'null')
    expect(await request('DELETE', '/api/applications/1')).toBeNull()
  })

  test('returns parsed JSON and sends a JSON body with same-origin credentials', async () => {
    const fn = mockFetch(201, '{"status_id":9,"name":"Onsite"}')
    expect(await request('POST', '/api/statuses', { name: 'Onsite' })).toEqual({ status_id: 9, name: 'Onsite' })
    const [path, init] = fn.mock.calls[0]
    expect(path).toBe('/api/statuses')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('same-origin')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"name":"Onsite"}')
  })

  test('throws ApiError with status and string detail', async () => {
    mockFetch(401, '{"detail":"Invalid credentials"}')
    const err = await request('POST', '/api/auth/login', {}).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(401)
    expect(err.detail).toBe('Invalid credentials')
  })

  test('uses the first validation message for 422', async () => {
    mockFetch(422, '{"detail":[{"msg":"Value error, cannot be null"},{"msg":"other"}]}')
    const err = await request('POST', '/api/applications', {}).catch((e) => e)
    expect(err.status).toBe(422)
    expect(err.detail).toBe('cannot be null')
  })

  test('still throws ApiError when the error body is not JSON', async () => {
    mockFetch(500, 'Internal Server Error')
    const err = await request('GET', '/api/x').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(500)
  })
})
