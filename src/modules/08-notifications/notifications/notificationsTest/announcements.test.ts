import { describe, expect, test } from 'bun:test'
import { db } from '../../db/database'
import { getAnnouncements } from '../announcements'

// Test helper: put a notification straight into the table
function addNotification(id: string, eventType: string, courseId: string, createdAt: string) {
    db.query(
        'INSERT INTO notifications (notification_id, event_type, course_id, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, eventType, courseId, `Subject ${id}`, `Message ${id}`, createdAt)
}

describe('getAnnouncements', () => {
    test('returns only announcements, not other event types', () => {
        addNotification('ann-1', 'announcement', 'course-a1', '2026-10-18T13:00:00Z')
        addNotification('grade-1', 'grade', 'course-a1', '2026-10-18T14:00:00Z')

        const ids = getAnnouncements('course-a1').map((a) => a.notification_id)

        expect(ids).toEqual(['ann-1'])
    })

    test('returns only that course', () => {
        addNotification('ann-2', 'announcement', 'course-a2', '2026-10-18T13:00:00Z')
        addNotification('ann-3', 'announcement', 'course-a3', '2026-10-18T13:00:00Z')

        const ids = getAnnouncements('course-a2').map((a) => a.notification_id)

        expect(ids).toEqual(['ann-2'])
    })

    test('newest first', () => {
        addNotification('ann-old', 'announcement', 'course-a4', '2026-10-01T09:00:00Z')
        addNotification('ann-new', 'announcement', 'course-a4', '2026-10-20T09:00:00Z')
        addNotification('ann-mid', 'announcement', 'course-a4', '2026-10-10T09:00:00Z')

        const ids = getAnnouncements('course-a4').map((a) => a.notification_id)

        expect(ids).toEqual(['ann-new', 'ann-mid', 'ann-old'])
    })

    test('items use the DP-03 shape', () => {
        addNotification('ann-4', 'announcement', 'course-a5', '2026-10-18T13:00:00Z')

        expect(getAnnouncements('course-a5')).toEqual([
            {
                notification_id: 'ann-4',
                content: { subject: 'Subject ann-4', message: 'Message ann-4' },
                created_at: '2026-10-18T13:00:00Z',
            },
        ])
    })

    test('a course with no announcements returns an empty list', () => {
        expect(getAnnouncements('course-empty')).toEqual([])
    })
})