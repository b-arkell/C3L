import { db } from '../db/database'

export interface Announcement {
    notification_id: string
    content: { subject: string; message: string }
    created_at: string
}

interface AnnouncementRow {
    notification_id: string
    subject: string
    message: string
    created_at: string
}

const selectAnnouncements = db.prepare(
    `SELECT notification_id, subject, message, created_at
     FROM notifications
     WHERE course_id = ? AND event_type = 'announcement'
     ORDER BY created_at DESC`,
)

// The table stores subject/message as flat columns; DP-03 nests them under "content"
export function getAnnouncements(courseId: string): Announcement[] {
    const rows = selectAnnouncements.all(courseId) as AnnouncementRow[]
    return rows.map((row) => ({
        notification_id: row.notification_id,
        content: { subject: row.subject, message: row.message },
        created_at: row.created_at,
    }))
}