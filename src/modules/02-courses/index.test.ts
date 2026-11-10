// index.test.ts
// Very small tests for module 2. Bun has a built-in test runner so we don't
// need jest or anything - just import test and expect from 'bun:test'.
//
// `mod.router.handle(...)` runs the router as if a real request came in, so we
// can check status codes and the HTML that comes back.

import { expect, test } from 'bun:test'
import mod from './index'

// Shortcut so I don't have to write the full Request each time.
// Reminder: inside the tests, routes start at "/" - the /02-courses part is
// added by the main app, so we don't include it here.
const get = (path: string) =>
  mod.router.handle(new Request(`http://localhost${path}`))

test('Module 2 dashboard loads', async () => {
  const response = await get('/')
  expect(response.status).toBe(200)
  // Just check it contains the heading - I don't want to lock the test to
  // the exact HTML in case I change the layout later.
  expect(await response.text()).toContain('Course Management')
})

test('Course catalog loads', async () => {
  const response = await get('/catalog')
  expect(response.status).toBe(200)
  expect(await response.text()).toContain('Course Catalog')
})

test('JSON API works', async () => {
  const response = await get('/api/courses')
  expect(response.status).toBe(200)
  
  const data = (await response.json()) as {
  courses: Array<{ id: string; code: string; title: string }>
}
expect(Array.isArray(data.courses)).toBe(true)
expect(data.courses.length).toBeGreaterThan(0)
})