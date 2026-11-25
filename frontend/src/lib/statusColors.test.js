import { expect, test } from 'vitest'
import { statusColor } from './statusColors.js'

test('built-in statuses use their named colours', () => {
  expect(statusColor({ status_id: 1, name: 'Applied', is_default: true })).toEqual({ text: '#5F656B', tint: '#ECEEF0' })
  expect(statusColor({ status_id: 6, name: 'Rejected', is_default: true })).toEqual({ text: '#963A30', tint: '#F5E3E0' })
})

test('custom statuses use status_id % 5', () => {
  expect(statusColor({ status_id: 10, name: 'Onsite', is_default: false })).toEqual({ text: '#8B5226', tint: '#F4E6DA' })
  expect(statusColor({ status_id: 12, name: 'X', is_default: false })).toEqual({ text: '#7A4A52', tint: '#F2E5E7' })
})

test('a custom status named like a built-in still uses the custom set', () => {
  expect(statusColor({ status_id: 11, name: 'Offer', is_default: false })).toEqual({ text: '#3F5F63', tint: '#E1ECEC' })
})
