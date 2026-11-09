import { db } from '../db/database'

export type MarkNotificationReadResult =
    | 'updated'
    | 'already-read'
    | 'forbidden'
    | 'not-found'

const notificationExists = db.prepare(`
    SELECT 1
    FROM notifications
    WHERE notification_id = ?
`)

const recipientLookup = db.prepare(`
    SELECT read_at
    FROM notification_recipients
    WHERE notification_id = ?
      AND user_id = ?
`)

const updateReadAt = db.prepare(`
    UPDATE notification_recipients
    SET read_at = ?
    WHERE notification_id = ?
      AND user_id = ?
`)

export function markNotificationRead(
    userId: string,
    notificationId: string,
): MarkNotificationReadResult {

    const notification = notificationExists.get(notificationId)

    if (!notification) {
        return 'not-found'
    }

    const recipient = recipientLookup.get(
        notificationId,
        userId,
    ) as { read_at: string | null } | undefined

    if (!recipient) {
        return 'forbidden'
    }

    if (recipient.read_at !== null) {
        return 'already-read'
    }

    updateReadAt.run(
        new Date().toISOString(),
        notificationId,
        userId,
    )

    return 'updated'
}