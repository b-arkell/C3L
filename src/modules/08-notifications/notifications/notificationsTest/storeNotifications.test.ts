import { describe, expect, test } from 'bun:test'
import { db } from '../../db/database'
import { storeNotification } from '../storeNotification'

const quizEvent = {
    event_type: 'quiz' as const,
    course_id: 'course-s1',
    content: { subject: 'Quiz 3 posted', message: 'Due Friday.'},
}


// How many rows a table has for a single notification
function countRows(table: string, notificationId: string): number {
    const row = db
        .query(`SELECT COUNT(*) AS n FROM ${table} WHERE notification_id = ?`)
        .get(notificationId) as {n: number}
        return row.n
}

describe('storeNotification', () => {
    test('stores the notification once and one row per recipient', () => {
        const id = storeNotification(quizEvent, ['user_a', 'user_b', 'user_c'])
        expect(id).not.toBeNull()
        expect(countRows('notifications', id as string)).toBe(1)
        expect(countRows('notification_recipients', id as string)).toBe(3)
    })

    test('recipients start unread', () => {
        const id = storeNotification(quizEvent, ['user_a']) as string
        const row = db
            .query('SELECT read_at FROM notification_recipients WHERE notification_id = ?')
            .get(id) as { read_at: string | null }
        expect(row.read_at).toBeNull()
    })

    test('a user listed twice gets one row', () => {
        const id = storeNotification(quizEvent, ['user_a', 'user_a']) as string
        expect(countRows('notification_recipients', id)).toBe(1)
    })

    test('stores nothing when there are no recipients', () => {
        expect(storeNotification(quizEvent, [])).toBeNull()
    })
})