import { db, initializeDatabase } from './database'
import { createNotification, markNotificationRead } from './notifications'

await initializeDatabase()

const result = db
    .query("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()

console.log(result)

const message = 'Assignment due tomorrow'
const insertStatement = db.query(
    'INSERT INTO tutorial_notifications (message) VALUES (?)'
)
insertStatement.run(message)

const newMessage = 'New course annoncemnet posted'
insertStatement.run(newMessage)

const updateStatement = db.query(
    'UPDATE tutorial_notifications SET is_read = 1 WHERE id = ?'
)
updateStatement.run(1)

const notifications = db.query(
    'SELECT * FROM tutorial_notifications WHERE is_read = 0'
).all()
console.log(notifications)

createNotification('Assignment due tomorrow')
createNotification('New Course announcement posted')
markNotificationRead(3)

const createNote = db.query(
    'SELECT * FROM tutorial_notifications'
).all()
console.log(createNote)
