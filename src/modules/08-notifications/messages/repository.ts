// Sam - Functions that touch the database
import { db } from '../db/database'

export interface Conversation {
    id: string
    name: string | null
    direct_key: string | null
    created_by: string
    created_at: string
}

export interface Message {
    id: string
    conversation_id: string
    sender_id: string
    body: string
    created_at: string
}

// Get conversation if it exists - returns record or null
export function findConversationById(conversationId: string): unknown {
    const stmt = db.prepare(
        'SELECT * FROM conversations WHERE id = ?'
    )
    return stmt.get(conversationId)
}

// Get a conversation member by conversation and user - returns record or null
export function findMembership(conversationId: string, userId: string): unknown {
    const selectUsersStmt = db.prepare(
        'SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL'
    )
    return selectUsersStmt.get(conversationId, userId)
}

// insert the message into the database - current returns Message or Null, but sqlite will throw an exception if there is a problem or null if it worked, but failed the return. TODO fix that.
export function insertMessage(messageId: string, conversationId: string, userId: string, message: string, createdAt: string): Message|null { 
    const insertStmt = db.prepare(
      'INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    if (insertStmt.run(messageId, conversationId, userId, message, createdAt).changes === 0) {
        return null
    }
    
    return {
        id: messageId,
        conversation_id: conversationId,
        sender_id: userId,
        body: message,
        created_at: createdAt,
    }
}

// get conversations
export function retrieveConversation(userId: string): Conversation[] {
    const getConvoStmt = db.prepare(
        'SELECT conversations.* FROM conversations INNER JOIN conversation_members ON conversations.id = conversation_members.conversation_id WHERE conversation_members.user_id = ? AND conversation_members.left_at IS NULL'
    ).all(userId) as Conversation[]
    return getConvoStmt
}

// get the last message of a conversation by conversationId - gets descending order then takes the top (most recent) record
export function retrieveLastMessage(conversationId: string): Message {
    const getMessage = db.prepare(
        'SELECT * FROM messages WHERE conversation_id = conversationId ORDERED BY created_at LIMIT 1'
    ).get(conversationId) as Message
    return getMessage
}

// get all messages of a conversation by conversationId - descending order (most recent first)
export function retrieveAllMessages(conversationId: string): Message[] {
    const getMessages = db.prepare(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC'
    ).all(conversationId) as Message[]
    return getMessages
}