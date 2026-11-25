import { expect, test } from 'vitest'
import { filterStatusOptions } from './statusOptions.js'

const statuses = [
  { status_id: 1, name: 'Applied', is_default: true },
  { status_id: 2, name: 'OA', is_default: true },
  { status_id: 8, name: 'Onsite', is_default: false },
]

test('empty query returns everything and no create option', () => {
  const r = filterStatusOptions(statuses, '')
  expect(r.builtIn).toHaveLength(2)
  expect(r.custom).toHaveLength(1)
  expect(r.createName).toBeNull()
})

test('filters by case-insensitive substring', () => {
  const r = filterStatusOptions(statuses, 'ONS')
  expect(r.custom.map((s) => s.name)).toEqual(['Onsite'])
  expect(r.builtIn).toEqual([])
})

test('exact match in another case gives no create option', () => {
  expect(filterStatusOptions(statuses, 'onsite').createName).toBeNull()
  expect(filterStatusOptions(statuses, ' oa ').createName).toBeNull()
})

test('unknown name offers create with the trimmed text', () => {
  expect(filterStatusOptions(statuses, '  Phone screen ').createName).toBe('Phone screen')
})

test('exactIndex points at the exact match so Enter picks it over earlier partial matches', () => {
  const list = [
    { status_id: 3, name: 'Interviewing', is_default: true },
    { status_id: 9, name: 'Interview', is_default: false },
  ]
  expect(filterStatusOptions(list, 'interview').exactIndex).toBe(1)
  expect(filterStatusOptions(list, 'inter').exactIndex).toBe(-1)
  expect(filterStatusOptions(list, '').exactIndex).toBe(-1)
})
