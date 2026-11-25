import { expect, test } from 'vitest'
import { describeFilters, hasFilters, EMPTY_FILTERS } from './filters.js'

const statuses = [
  { status_id: 4, name: 'Offer' },
  { status_id: 8, name: 'Onsite' },
  { status_id: 6, name: 'Rejected' },
]

test('summarises role and statuses like the spec example', () => {
  expect(describeFilters({ role: 'quant', company: '', statuses: [4, 8] }, statuses))
    .toBe('Role starts with "quant", status is Offer or Onsite.')
})

test('summarises company only, and three statuses', () => {
  expect(describeFilters({ role: '', company: 'AT&T', statuses: [] }, statuses)).toBe('Company starts with "AT&T".')
  expect(describeFilters({ role: '', company: '', statuses: [4, 8, 6] }, statuses))
    .toBe('Status is Offer, Onsite or Rejected.')
})

test('hasFilters ignores whitespace-only text', () => {
  expect(hasFilters(EMPTY_FILTERS)).toBe(false)
  expect(hasFilters({ role: '  ', company: '', statuses: [] })).toBe(false)
  expect(hasFilters({ role: '', company: '', statuses: [1] })).toBe(true)
})
