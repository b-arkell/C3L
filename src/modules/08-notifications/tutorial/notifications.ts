import { db } from './database'

// C - Create
export function createNotification(message: string) {
    if(message.trim().length === 0) {
        throw new Error('Notification message cannot be empty')
    }
    const insertStatement = db.query(
        'INSERT INTO tutorial_notifications (message) VALUES (?)'
    )
    insertStatement.run(message)
}

// R - Read

// U - Update
// U - update is_read
export function markNotificationRead(id: number) {
    if(!(id >= 0)) {
        throw new Error('Cannot based on invalid message id')
    }
    const updateStatement = db.query(
        'UPDATE tutorial_notifications SET is_read = 1 WHERE id = ?'
    )
    updateStatement.run(id)
}

// D - Delete

