// DEMO ONLY: routes for the guided demo. Remove this folder (and its .use in index.ts) to drop it.
import { Elysia } from 'elysia'
import { auth } from '../auth'
import { createConversation, sendMessage } from '../messages/service'
import { demoSectionPage, demoStartPage, SECTIONS, type Section } from './demoPages'

const BASE = '/08-notifications'
const CLASSMATE = 'demo-classmate' // fake second user for the messaging demo

export const demoRoutes = new Elysia()
    // Public: the user isn't registered yet when they land here
    .get('/demo', () => demoStartPage(BASE))
    .use(auth)
    .get('/demo/:section', ({ params, user, set }) => {
        if (!(params.section in SECTIONS)) {
            set.status = 404
            return '<h1>No such demo section</h1>'
        }
        return demoSectionPage(BASE, params.section as Section, user.user_id)
    })
    // Opens (or reuses) a 1:1 chat with the fake classmate and posts a message from them
    .post('/api/demo/message', ({ user, set }) => {
        const chat = createConversation(CLASSMATE, undefined, [user.user_id])
        if (chat.status === 'self_conversation') {
            set.status = 400
            return { error: 'Cannot message yourself' }
        }
        const sent = sendMessage(chat.conversationId, CLASSMATE, `Hey! Did you finish the lab? (${new Date().toLocaleTimeString()})`)
        if (sent.status !== 'success') {
            set.status = 500
            return { error: sent.status }
        }
        set.status = 201
        return { conversation_id: chat.conversationId }
    })