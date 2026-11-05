import { describe, expect, test } from 'bun:test'
import { db } from '../../db/database'
import { getPreferences } from '../preferences'

// Test helper: mute a category directly in the table
function mute(userId: string, courseId: string, category: string) {
    db.query(
        'INSERT INTO notification_preferences (user_id, course_id, category, muted_at) VALUES (?, ?, ?, ?)',
    ).run(userId, courseId, category, new Date().toISOString())
}

describe('getPreferences', () => {
    test('groups muted types by course (DP-04 shape)', () => {
        mute('user-20', 'course-1', 'grade')
        mute('user-20', 'course-1', 'quiz')
        mute('user-20', 'course-2', 'content')

        expect(getPreferences('user-20')).toEqual([
            { course_id: 'course-1', event_types: ['grade', 'quiz'] },
            { course_id: 'course-2', event_types: ['content'] },
        ])
    })

    test("only returns the requesting user's data", () => {
        mute('user-21', 'course-1', 'grade')
        mute('user-22', 'course-1', 'quiz')

        expect(getPreferences('user-21')).toEqual([{ course_id: 'course-1', event_types: ['grade'] }])
    })

    test('a user with nothing muted gets an empty list', () => {
        expect(getPreferences('user-23')).toEqual([])
    })
})