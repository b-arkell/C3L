import { db } from '../db/database'
import type { IncomingSubscribe } from "./subscribe";

// formats the parameterized query
const insertMute = db.prepare(
    'INSERT OR IGNORE INTO notification_preferences (user_id, course_id, category, muted_at) VALUES (?, ?, ?, ?)',
)

// adds preference rows to signify a user has opted to mute notifications
export function muteCategories(userId: string, unsubscribe: IncomingSubscribe): void {
    const now = new Date().toISOString()
    db.transaction(() => {
        for (const category of unsubscribe.event_type) {
            insertMute.run(userId, unsubscribe.course_id, category, now)
        }
    })()
}