import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { page } from '../views'
import { listConversations, sendMessage } from './service'


export const messageRoutes = new Elysia()
  .use(auth)
  .get('/messages', () => page('Messages', '<h1>Messages</h1><p>Coming soon.</p>'))


  .post('/api/directMessage/:conversationId', ({ params, body, user, set }) => {
    
    const savedMessage = sendMessage(params.conversationId, user.user_id, body.message)
    if (savedMessage.status === 'conversation_not_found') {
      console.warn({
        timestamp: new Date().toISOString(),
        route: '/api/directMessage/:conversationId',
        status_code: 404,
        reason: 'conversation_not_found'
      })
      set.status = 404
      return { error: 'Conversation not found' }
    }
    if (savedMessage.status === 'not_a_member') {
      console.warn({
        timestamp: new Date().toISOString(),
        route: '/api/directMessage/:conversationId',
        status_code: 403,
        reason: 'not_a_member'
      })
      set.status = 403
      return { error: 'User is not an active member of this conversation' }
    }
    if (savedMessage.status === 'insertion_failed') {
      console.warn({
        timestamp: new Date().toISOString(),
        route: '/api/directMessage/:conversationId',
        status_code: 500,
        reason: 'insertion_failed'
      })
      set.status = 500
      return { error: 'Insertion of message into database failed'}
    }

    set.status = 201
    return savedMessage.message

  }, {
    body: t.Object({  // to log this error, we have to add an Elysia error hook for this and other schema validation failures
      message: t.String({ minLength: 1, maxLength: 280 }) // checks that the message body is not empty otherwise status is 422 - unprocessable entity
    })
  })

  // ^^^^ (future merge confict message) FR-14 .post('/api/directMessage/:conversationId' is above this line
  // The next thing goes below this line

  .get('/api/me/conversations', ({ user }) => {
    const conversations = listConversations(user.user_id)
    return conversations
  })