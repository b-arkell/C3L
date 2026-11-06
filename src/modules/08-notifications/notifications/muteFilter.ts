import { db } from '../db/database'
import type { EventType } from './eventTypes'

// Get all users that muted this category in this course
const findMutedUsers = db.prepare(
    'SELECT user_id FROM notification_preferences WHERE course_id = ? AND category = ?',
)

// remove the useres that have muted this event type in this course
export function removeMutedUsers(recipients: string[], courseId: string, eventType: EventType): string[] {
    const rows = findMutedUsers.all(courseId, eventType) as { user_id: string }[]
    const muted = new Set(rows.map((row) => row.user_id)) // Set is a collection of unique values (fast lookup)
    return recipients.filter((userId) => !muted.has(userId)) // .filter creates new array only with users that are not muted
}
