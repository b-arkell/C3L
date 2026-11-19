import { db } from '../db/database'
import type { EventType } from './eventTypes'

export interface NotificationDto {
    notification_id: string
    event_type: EventType
    course_id: string | null
    content: {
        subject: string
        message: string
    }
    created_at: string
    read_at: string | null
}

interface NotificationRow {
    notification_id: string
    event_type: EventType
    course_id: string | null
    subject: string
    message: string
    created_at: string
    read_at: string | null
}

const getNotificationsQuery = db.query(`
    SELECT
        n.notification_id,
        n.event_type,
        n.course_id,
        n.subject,
        n.message,
        n.created_at,
        r.read_at
    FROM notifications n
    JOIN notification_recipients r
        ON n.notification_id = r.notification_id
    WHERE r.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ?
`)

// GET /08-notifications/api/users/me/notifications
// --> Returns all (up to 1000)

// GET /08-notifications/api/users/me/notifications?limit=20
// --> Returns the newest 20

export function getNotifications(
    userId: string,
    limit = 1000,
): NotificationDto[] {

    const rows = getNotificationsQuery.all(
        userId,
        limit,
    ) as NotificationRow[]

    return rows.map(row => ({
        notification_id: row.notification_id,
        event_type: row.event_type,
        course_id: row.course_id,
        content: {
            subject: row.subject,
            message: row.message,
        },
        created_at: row.created_at,
        read_at: row.read_at,
    }))
}