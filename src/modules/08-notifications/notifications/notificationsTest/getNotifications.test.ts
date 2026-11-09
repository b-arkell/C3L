import { describe, expect, test } from 'bun:test'
import { db } from '../../db/database'
import { getNotifications } from '../getNotifications'
import { storeNotification } from '../storeNotification'
import { beforeEach } from 'bun:test'
import mod from '../../index'

beforeEach(() => {
    db.exec('DELETE FROM notification_recipients')
    db.exec('DELETE FROM notifications')
})

const quizEvent = {
    event_type: 'quiz' as const,
    course_id: 'course-s1',
    content: {
        subject: 'Quiz 3 posted',
        message: 'Due Friday'
    },
}

describe('getNotifications', () => {
    test('returns only notifications for the requested user', () => {
        storeNotification(quizEvent, ['user_a'])
        storeNotification(quizEvent, ['user_b'])

        const notifications = getNotifications('user_a')

        expect(notifications).toHaveLength(1)
    })

    test('returns unread notifications with read_at null', () => {
        storeNotification(quizEvent, ['user_a'])

        const notifications = getNotifications('user_a')

        expect(notifications[0].read_at).toBeNull()
    })

    test('returns notifications in the DP-03 shape', () => {
        storeNotification(quizEvent, ['user_a'])

        const notifications = getNotifications('user_a')

        expect(notifications[0].content).toEqual({
            subject: 'Quiz 3 posted',
            message: 'Due Friday',
        })
    })

    test('returns newest notifications first', () => {
        const oldId = storeNotification(
            {
                event_type: 'quiz',
                course_id: 'course-s1',
                content: {
                    subject: 'Older Notification',
                    message: 'Old',
                },
            },
            ['user_a'],
        ) as string

        const newId = storeNotification(
            {
                event_type: 'quiz',
                course_id: 'course-s1',
                content: {
                    subject: 'Newer Notification',
                    message: 'New',
                },
            },
            ['user_a'],
        ) as string

        db.prepare(
            'UPDATE notifications SET created_at = ? WHERE notification_id = ?',
        ).run('2026-01-01T00:00:00Z', oldId)

        db.prepare(
            'UPDATE notifications SET created_at = ? WHERE notification_id = ?',
        ).run('2026-01-02T00:00:00Z', newId)

        const notifications = getNotifications('user_a')

        expect(notifications[0].notification_id).toBe(newId)
        expect(notifications[1].notification_id).toBe(oldId)
    })


    test('respects the limit parameter', () => {
        storeNotification(quizEvent, ['user_a'])
        storeNotification(quizEvent, ['user_a'])
        storeNotification(quizEvent, ['user_a'])

        const notifications = getNotifications('user_a', 2)

        expect(notifications).toHaveLength(2)
    })

    test('returns all notifications when limit is omitted', () => {
        storeNotification(quizEvent, ['user_a'])
        storeNotification(quizEvent, ['user_a'])
        storeNotification(quizEvent, ['user_a'])

        const notifications = getNotifications('user_a')

        expect(notifications.length).toBe(3)
    })

    test('allows a valid limit', async () => {
        const res = await mod.router.handle(
            new Request(
                'http://localhost/api/users/me/notifications?limit=10',
            ),
        )

        expect(res.status).toBe(200)
    })

    test('rejects negative limit', async () => {
        const res = await mod.router.handle(
            new Request(
                'http://localhost/api/users/me/notifications?limit=-1',
            ),
        )

        expect(res.status).toBe(400)
    })

    test('rejects zero limit', async () => {
        const res = await mod.router.handle(
            new Request(
                'http://localhost/api/users/me/notifications?limit=0',
            ),
        )

        expect(res.status).toBe(400)
    })

    test('rejects a limit above maximum', async () => {
        const res = await mod.router.handle(
            new Request(
                'http://localhost/api/users/me/notifications?limit=101',
            ),
        )

        expect(res.status).toBe(400)
    })
})