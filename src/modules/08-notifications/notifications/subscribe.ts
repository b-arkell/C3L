import { db } from '../db/database'
import type { EventType } from "./eventTypes";

// parts of a subscribe that functions need to look at 
export interface IncomingSubscribe {
    course_id: string
    event_type: EventType[]
}

// formats the parameterized query
const deletePreference = db.prepare(
    'DELETE FROM notification_preferences WHERE user_id = ? AND course_id = ? AND category = ?',
)

// deletes preference rows to signify a user has opted in
export function unmuteCategories(userId: string, subscribe: IncomingSubscribe): void {
    db.transaction(() => {
        for (const category of subscribe.event_type) {
            deletePreference.run(userId, subscribe.course_id, category)
        }
    })()
}