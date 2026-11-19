// Dev only: fills the real database with fake preferences so the page has something to show.
// Run with: bun src/modules/08-notifications/db/seed.ts
import { db } from './database'

const USER_ID = 'user_test' // copy from the /inbox page

const insertMute = db.prepare(
    'INSERT OR IGNORE INTO notification_preferences (user_id, course_id, category, muted_at) VALUES (?, ?, ?, ?)',
)

const fakeMutes: [string, string][] = [
    ['course-101', 'quiz'],
    ['course-101', 'discussion'],
    ['course-202', 'grade'],
    ['course-303', 'content'],
]

const now = new Date().toISOString()
for (const [courseId, category] of fakeMutes) {
    insertMute.run(USER_ID, courseId, category, now)
}
console.log(`Seeded ${fakeMutes.length} muted rows for ${USER_ID}`)