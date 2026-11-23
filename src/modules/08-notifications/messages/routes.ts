import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { page } from '../views'
import { getAllMessagesInConvo, leaveConversation, listConversations, markAsRead, sendMessage, createConversation } from './service'
//import { set } from 'better-auth'
import { conversationExists, isActiveMember } from './validation'
//import { updateLastReadAt } from './repository'



export const messageRoutes = new Elysia()
  .use(auth)
  .get('/messages', () => page('Messages', '<h1>Messages</h1><p>Coming soon.</p>'))


  .post('/api/directMessageCreation', ({ body, user, set }) => {
      if (
        body.recipients_emails.length > 1 &&
        !body.group_name
      ) {

        set.status = 400

        return {
          error:
            'group_name is required when creating a group conversation',
        }
      }

      const result = createConversation(
        user.user_id,
        body.group_name,
        body.recipients_emails,
      )

      if (result.status === 'self_conversation') {

        set.status = 400

        return {
          error:
            'Cannot create a conversation with yourself',
        }
      }

      set.status =
        result.status === 'created'
          ? 201
          : 200

      return {
        conversation_id:
          result.conversationId,
      }
    },
    {
      body: t.Object({
        group_name: t.Optional(
          t.String({
            minLength: 1,
          }),
        ),

        recipients_emails: t.Array(
          t.String(),
          {
            minItems: 1,
          },
        ),
      }),
    },
  )
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

  // updating last read at
  .patch('/api/me/conversations/:conversationId/read', ({ params, user, set }) => {
    const isRead = markAsRead(params.conversationId, user.user_id)
    if (!isRead) {
      set.status = 404
      return { error: 'Conversation not found or user is not an active member' }
    }
    else {
      set.status = 200
      return { message: 'Conversation marked as read' }
    }
  }) 

  // ^^^^ (future merge confict message) FR-14 .post('/api/directMessage/:conversationId' is above this line
  // The next thing goes below this line

  //listing conversations
  .get('/api/me/conversations', ({ user }) => {
    const conversations = listConversations(user.user_id)
    return conversations
  })

  //listing messages in a specific conversation
  .get('/api/me/conversations/:conversationId', ({ params, user, set }) => {
    if (!conversationExists(params.conversationId)) {
      set.status = 404
      return { error: 'Cannot find conversation' }
    }
    if (!isActiveMember(params.conversationId, user.user_id)) {
      set.status = 403
      return { error: 'Not an active member of this conversation'}
    }
    const messages = getAllMessagesInConvo(params.conversationId)
    return messages

    //const chronologicalMessages = messages.reverse()  // messages are retrieved newest to oldest, this switches them.(quick fix)

    // const previouslyRead = messages.filter(
    //   message => message.created_at <= lastReadAt 
    // )
    // const unread = messages.filter(
    //   message => message.created_at > lastReadAt
    // )

  })

  //leaving conversation
  .patch('/api/directMessage/unsubscribe/:conversationId', ({ params, user, set}) => {
    if (!leaveConversation(params.conversationId, user.user_id)) {
      set.status = 404
      return { error: 'Cannot find conversation' }
    }
    set.status = 200
    return { message: 'Member left conversation' }
  })