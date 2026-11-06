import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { page } from '../views'
import { db } from '../db/database'


export const messageRoutes = new Elysia()
  .use(auth)
  .get('/messages', () => page('Messages', '<h1>Messages</h1><p>Coming soon.</p>'))


  .post('/api/directMessage/:conversationId', ({ params, body, user, set }) => {
    
    const stmt = db.prepare(
    'SELECT * FROM conversations WHERE id = ?'
    )
    const conversation = stmt.get(params.conversationId)

    if (conversation === null) {
      set.status = 404
      return { error: 'Conversation not found' }
    }

    const selectUsersStmt = db.prepare(
      'SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL'
    )
    const membership = selectUsersStmt.get(params.conversationId, user.user_id)

    if (membership === null){
      set.status = 403
      return { error: 'User is not an active member of this conversation' }
    }

    const messageId = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const insertMessage = db.prepare(
      'INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    insertMessage.run(messageId, params.conversationId, user.user_id, body.message, createdAt)
    set.status = 201

    return {
      id: messageId,
      conversationId: params.conversationId,
      senderId: user.user_id,
      body: body.message,
      created_at: createdAt,
    }
  }, {
    body: t.Object({
      message: t.String({ minLength: 1, maxLength: 280 })
    })
  })