import { db } from '../db/database'
import type { EventType } from "./eventTypes";

interface MutedRow {
    course_id: string
    category: EventType
}

// formats the parameterized query
const findMuted = db.prepare(
    `SELECT course_id, category
    FROM notification_preferences
    WHERE user_id = ?
    ORDER BY course_id`,
)

// deletes preference rows to signify a user has opted in
export function getPreferences(userId: string, courseIds: string[]): { course_id: string; event_types: EventType[] }[] {
    const rows = findMuted.all(userId) as MutedRow[]

    const byCourse = new Map<string, EventType[]>()
    for (const courseId of courseIds) {
        byCourse.set(courseId, [])
    }

    for (const row of rows) {
        byCourse.get(row.course_id)?.push(row.category)
    }

    // Turn the Map into DP-04 items
    return [...byCourse].map(([course_id, event_types]) => ({ course_id, event_types }))
}