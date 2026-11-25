import { expect, test } from 'vitest'
import { safeHref } from './links.js'

test('keeps http and https links', () => {
  expect(safeHref('https://careers.datadoghq.com/detail/5871')).toBe('https://careers.datadoghq.com/detail/5871')
  expect(safeHref('  http://x.com ')).toBe('http://x.com')
})

test('adds https to links typed without a scheme', () => {
  expect(safeHref('jobs.lever.co/ramp/123')).toBe('https://jobs.lever.co/ramp/123')
})

test('refuses scripts and other schemes', () => {
  expect(safeHref('javascript:alert(1)')).toBeNull()
  expect(safeHref(' JavaScript:alert(1)')).toBeNull()
  expect(safeHref('data:text/html,hi')).toBeNull()
  expect(safeHref('')).toBeNull()
  expect(safeHref(null)).toBeNull()
})
