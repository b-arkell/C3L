import { describe, expect, test } from 'bun:test'
import { db } from '../../db/database'
import { unmuteCategories } from '../subscribe'

// Test helpers: mute a category directly, and read back what's muted
function mute(userId: string, courseId: string, category: string) {
    db.query(
        'INSERT INTO notification_preferences (user_id, course_id, category, muted_at) VALUES (?, ?, ?, ?)',
    ).run(userId, courseId, category, new Date().toISOString())
}

function mutedCategories(userId: string, courseId: string): string[] {
    const rows = db
        .query('SELECT category FROM notification_preferences WHERE user_id = ? AND course_id = ? ORDER BY category')
        .all(userId, courseId) as { category: string }[]
    return rows.map((row) => row.category)
}


describe('unmuteCategories', () => {
    test('removes the mute for a subscribed category only', () => {
        mute('user-1', 'course-1', 'grade')
        mute('user-1', 'course-1', 'quiz')

        unmuteCategories('user-1', { course_id: 'course-1', event_type: ['grade'] })

        expect(mutedCategories('user-1', 'course-1')).toEqual(['quiz'])
    })

    test('subscribing to an already-enabled type creates nothing', () => {
        unmuteCategories('user-2', { course_id: 'course-1', event_type: ['grade'] })

        expect(mutedCategories('user-2', 'course-1')).toEqual([])
    })

    test('repeated types in one request are harmless', () => {
        mute('user-3', 'course-1', 'grade')

        unmuteCategories('user-3', { course_id: 'course-1', event_type: ['grade', 'grade'] })

        expect(mutedCategories('user-3', 'course-1')).toEqual([])
    })

    test('only affects the given course', () => {
        mute('user-4', 'course-1', 'grade')
        mute('user-4', 'course-2', 'grade')

        unmuteCategories('user-4', { course_id: 'course-1', event_type: ['grade'] })

        expect(mutedCategories('user-4', 'course-2')).toEqual(['grade'])
    })
})