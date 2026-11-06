import { db } from '../db/database'
import type { EventType } from "./eventTypes";

export interface NotificationToStore{
    event_type: EventType
    course_id: string
    content: { subject: string; message: string }
}

const insertNotification = db.prepare(
    'INSERT INTO notifications (notification_id, event_type, course_id, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
)

const insertRecipient = db.prepare(
    'INSERT OR IGNORE INTO notification_recipients (notification_id, user_id) VALUES (?, ?)',
)

// saves the notification once, and one unread row for each recipient
// returns new notification's ID, if null there was no recipient 
export function storeNotification(event: NotificationToStore, recipients: string[]): string | null {
    if (recipients.length === 0){
        return null; // return null if there was no recipient
    }

    const notificationId = crypto.randomUUID()
    const now = new Date().toISOString()

    db.transaction(() => {
        insertNotification.run(
            notificationId,
            event.event_type,
            event.course_id,
            event.content.subject,
            event.content.message,
            now,

        )
        // loop through recipients
        for (const userId of recipients){
            insertRecipient.run(notificationId, userId)
        }
    })()

    return notificationId
}


