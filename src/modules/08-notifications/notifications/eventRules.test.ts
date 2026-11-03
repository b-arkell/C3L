import { expect, test } from 'bun:test'
import { checkEventRules } from './eventRules'

const GRADE_ERROR = 'user_ids is required for grade events'

test('rejects a grade event with no user_ids', () => {
  expect(checkEventRules({ event_type: 'grade', course_id: 'course-123' })).toBe(GRADE_ERROR)
})

test('rejects a grade event with an empty user_ids list', () => {
  expect(checkEventRules({ event_type: 'grade', course_id: 'course-123', user_ids: [] })).toBe(
    GRADE_ERROR,
  )
})

test('accepts a grade event with user_ids', () => {
  expect(
    checkEventRules({ event_type: 'grade', course_id: 'course-123', user_ids: ['user-7'] }),
  ).toBeNull()
})

test('accepts a non-grade event without user_ids', () => {
  expect(checkEventRules({ event_type: 'quiz', course_id: 'course-123' })).toBeNull()
})