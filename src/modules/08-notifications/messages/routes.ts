import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { page } from '../views'
import { findConversationById, findMembership, insertMessage } from './repository'


export const messageRoutes = new Elysia()
  .use(auth)
  .get('/messages', () => page('Messages', '<h1>Messages</h1><p>Coming soon.</p>'))


  .post('/api/directMessage/:conversationId', ({ params, body, user, set }) => {
    

    if (findConversationById(params.conversationId) === null) {
      set.status = 404
      return { error: 'Conversation not found' }
    }

    if (findMembership(params.conversationId, user.user_id) === null){
      set.status = 403
      return { error: 'User is not an active member of this conversation' }
    }

    // create message 
    const messageId = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    
    const savedMessage = insertMessage(messageId, params.conversationId, user.user_id, body.message, createdAt)

    // TODO: check that the message returned properly (not an sql exception or null) before setting status and returning
    set.status = 201
    return savedMessage

  }, {
    body: t.Object({
      message: t.String({ minLength: 1, maxLength: 280 }) // checks that the message body is not empty otherwise status is 422 - unprocessable entity
    })
  })

  // ^^^^ (future merge confict message) FR-14 .post('/api/directMessage/:conversationId' is above this line
  // The next thing goes below this line