import { expect, test } from 'vitest'
import { toApplicationBody, validateApplication } from './validate.js'

const valid = { company: 'Stripe', role: 'Backend intern', status_id: 1, portal_url: '', notes: '' }

test('requires company and role after trimming', () => {
  const errors = validateApplication({ ...valid, company: ' ', role: '' })
  expect(errors.company).toBe('Enter a company.')
  expect(errors.role).toBe('Enter a role.')
})

test('limits lengths', () => {
  expect(validateApplication({ ...valid, company: 'a'.repeat(256) }).company).toBe('Keep this under 256 characters.')
  expect(validateApplication({ ...valid, role: 'a'.repeat(255) })).toEqual({})
  expect(validateApplication({ ...valid, portal_url: 'a'.repeat(2049) }).portal_url).toBe('Keep the link under 2,049 characters.')
})

test('requires a status', () => {
  expect(validateApplication({ ...valid, status_id: null }).status_id).toBe('Choose a status.')
})

test('accepts a valid form', () => {
  expect(validateApplication(valid)).toEqual({})
})

test('toApplicationBody trims text and sends empty optional fields as null', () => {
  expect(toApplicationBody({ company: ' Ramp ', role: 'SWE ', status_id: 3, portal_url: '  ', notes: '\n ' }))
    .toEqual({ company: 'Ramp', role: 'SWE', status_id: 3, portal_url: null, notes: null })
  expect(toApplicationBody({ company: 'A', role: 'B', status_id: 1, portal_url: ' https://x.com ', notes: 'line 1\nline 2\n' }))
    .toEqual({ company: 'A', role: 'B', status_id: 1, portal_url: 'https://x.com', notes: 'line 1\nline 2' })
})
