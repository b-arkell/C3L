import { describe, expect, test } from 'bun:test'
import { db } from '../../db/database'
import { storeNotification } from '../storeNotification'
import { markNotificationRead } from '../markNotificationRead'

const quizEvent = {
    event_type: 'quiz' as const,
    course_id: 'course-s1',
    content: {
        subject: 'Quiz 3 posted',
        message: 'Due Friday.',
    },
}

describe('markNotificationRead', () => {

    test('marks an unread notification as read', () => {

        const id = storeNotification(
            quizEvent,
            ['user_a'],
        ) as string

        expect(
            markNotificationRead(
                'user_a',
                id,
            ),
        ).toBe('updated')

        const row = db
            .query(`
                SELECT read_at
                FROM notification_recipients
                WHERE notification_id = ?
                  AND user_id = ?
            `)
            .get(id, 'user_a') as {
                read_at: string | null
            }

        expect(row.read_at).not.toBeNull()
    })

    test('returns not-found for an unknown notification', () => {

        expect(
            markNotificationRead(
                'user_a',
                'does-not-exist',
            ),
        ).toBe('not-found')
    })

    test('returns forbidden when user is not a recipient', () => {

        const id = storeNotification(
            quizEvent,
            ['user_a'],
        ) as string

        expect(
            markNotificationRead(
                'user_b',
                id,
            ),
        ).toBe('forbidden')
    })

    test('does not overwrite an existing read_at', () => {

        const id = storeNotification(
            quizEvent,
            ['user_a'],
        ) as string

        markNotificationRead(
            'user_a',
            id,
        )

        const firstRow = db
            .query(`
                SELECT read_at
                FROM notification_recipients
                WHERE notification_id = ?
                  AND user_id = ?
            `)
            .get(id, 'user_a') as {
                read_at: string
            }

        markNotificationRead(
            'user_a',
            id,
        )

        const secondRow = db
            .query(`
                SELECT read_at
                FROM notification_recipients
                WHERE notification_id = ?
                  AND user_id = ?
            `)
            .get(id, 'user_a') as {
                read_at: string
            }

        expect(secondRow.read_at).toBe(firstRow.read_at)
    })
})