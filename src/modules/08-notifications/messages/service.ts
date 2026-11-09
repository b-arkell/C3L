// Sam - Service functions for messaging routes
import { insertMessage, type Message } from "./repository"
import { conversationExists, isActiveMember } from "./validation";

export type SendMessageResult =
    | { status: 'conversation_not_found' }
    | { status: 'not_a_member' }
    | { status: 'insertion_failed' }
    | { status: 'success'; message: Message }

export function sendMessage(conversationId: string, userId: string, message: string): SendMessageResult {
    if (!conversationExists(conversationId))
        return {status: 'conversation_not_found'}
    if (!isActiveMember(conversationId, userId))
        return {status: 'not_a_member'}

    const messageId = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const savedMessage = insertMessage(messageId, conversationId, userId, message, createdAt)

    if (savedMessage === null) 
        return {status: 'insertion_failed'}
    
    return {status: 'success', message: savedMessage}
}