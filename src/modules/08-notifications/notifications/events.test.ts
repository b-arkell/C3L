import { expect, test } from 'bun:test'
import mod from '../index'

// Sends a POST to the events route, like the curl command did
const postEvent = (body: unknown) =>
  mod.router.handle(
    new Request('http://localhost/api/notifications/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )

test('accepts a valid event with 204', async () => {
  const res = await postEvent({
    event_type: 'quiz',
    course_id: 'course-123',
    content: { subject: 'Quiz 3 posted', message: 'Due Friday.' },
  })
  expect(res.status).toBe(204)
})

test('rejects an unknown event type', async () => {
  const res = await postEvent({
    event_type: 'banana',
    course_id: 'course-123',
    content: { subject: 'Hi', message: 'Hello' },
  })
  expect(res.status).toBe(400)
})

test('rejects a body missing content', async () => {
  const res = await postEvent({ event_type: 'quiz', course_id: 'course-123' })
  expect(res.status).toBe(400)
})

test('rejects a subject longer than 50 characters', async() => {
  const res = await postEvent({
    event_type: 'quiz',
    course_id: 'course-123',
    content: { subject: 'x'.repeat(51), message: 'Hello'},
  })
  expect(res.status).toBe(400)
})

test('rejects a grade event without user_ids', async () => {
  const res = await postEvent({
    event_type: 'grade',
    course_id: 'course-123',
    content: {subject: 'A2 graded', message: 'your grade is posted.'},
  })
  expect(res.status).toBe(400)
  expect(await res.json()).toEqual({error: 'user_ids is required for grade events'})
})