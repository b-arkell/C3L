// Run with: bun src/modules/08-notifications/db/seed-messages.ts
import { db } from './database'

const conversation = 'test-conversation'
const userId = 'user_3'
const now = new Date().toISOString()

const insertConversation = db.prepare(
    'INSERT OR IGNORE INTO conversations (id, created_by, created_at) VALUES (?, ?, ?)'
)
insertConversation.run(conversation, userId, now)

const insertConversationMembers = db.prepare(
    'INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)'
)
insertConversationMembers.run(conversation, userId, now)