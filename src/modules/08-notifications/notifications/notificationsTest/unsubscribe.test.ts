import { describe, expect, test } from 'bun:test'
import { db } from '../../db/database'
import { muteCategories } from '../unsubscribe'

function mutedCategories(userId: string, courseId: string): string[] {
    const rows = db
        .query('SELECT category FROM notification_preferences WHERE user_id = ? AND course_id = ? ORDER BY category')
        .all(userId, courseId) as { category: string }[]
    return rows.map((row) => row.category)
}

describe('muteCategories', () => {
    test('mutes every type in the request', () => {
        muteCategories('user-10', { course_id: 'course-1', event_type: ['grade', 'quiz'] })

        expect(mutedCategories('user-10', 'course-1')).toEqual(['grade', 'quiz'])
    })

    test('muting an already-muted type creates no duplicate', () => {
        muteCategories('user-11', { course_id: 'course-1', event_type: ['grade'] })
        muteCategories('user-11', { course_id: 'course-1', event_type: ['grade', 'grade'] })

        expect(mutedCategories('user-11', 'course-1')).toEqual(['grade'])
    })

    test('only affects the given course', () => {
        muteCategories('user-12', { course_id: 'course-1', event_type: ['grade'] })

        expect(mutedCategories('user-12', 'course-2')).toEqual([])
    })
})