// Sam - Service functions for messaging routes

import { type Conversation, insertMessage, retrieveAllMessages, retrieveConversation, retrieveLastMessage, retrieveLastReadAt, updateLastReadAt, updateLeftAt, type Message } from './repository'
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
    
    console.info({
        timestamp: new Date().toISOString(),
        event_type: 'message_send',
        conversation_id: conversationId,
        user_id: userId
    })
    return {status: 'success', message: savedMessage}
}

export function listConversations(userId: string): Conversation[] {
    return retrieveConversation(userId)
}

export function getLastMessage(conversationId: string): Message {
    return retrieveLastMessage(conversationId)
}

export function getAllMessagesInConvo(conversationId: string): Message[] {
    return retrieveAllMessages(conversationId)
}

// Mark message as read for specific user/conversation
export function markAsRead(conversationId: string, userId: string): boolean {
    if (!conversationExists(conversationId) || !isActiveMember(conversationId, userId)) {
        return false
    }
    updateLastReadAt(conversationId, userId)
    return true
}

// get the first unread message 
export function getFirstUnread(conversationId: string, userId: string): Message|null {
    if (!conversationExists(conversationId) || !isActiveMember(conversationId, userId)) {
        return null
    }
    const lastRead = retrieveLastReadAt(conversationId, userId)
    if (lastRead === null)
        return null

    const messages = getAllMessagesInConvo(conversationId)    
    const chronologicalMessages = [...messages].reverse()
    if (lastRead.last_read_at === null)
        return chronologicalMessages[0] ?? null
    
    const timeStamp = lastRead.last_read_at

    return chronologicalMessages.find(
        message => message.created_at > timeStamp
    ) ?? null
}

// Get all the unread messages of a conversation for a specific user
export function getAllUnread(conversationId: string, userId: string): Message[]|null {
    if (!conversationExists(conversationId) || !isActiveMember(conversationId, userId)) {
        return null
    }
    const lastRead = retrieveLastReadAt(conversationId, userId)
    if (lastRead === null)
        return null
    const messages = getAllMessagesInConvo(conversationId)
    if (lastRead.last_read_at === null)
        return messages
    
    const timeStamp = lastRead.last_read_at

    const unreadMessages = messages.filter((message) => message.created_at > timeStamp)
    return unreadMessages
}

// leave a conversation
export function leaveConversation(conversationId: string, userId: string): boolean {
    if (!conversationExists(conversationId) || !isActiveMember(conversationId, userId)) {
        return false
    }
    updateLeftAt(conversationId, userId)
    return true
}