import { describe, expect, test } from 'bun:test'
import { db } from '../../db/database'
import { messageRoutes } from '../routes'

function addTestConversation(conversationId: string, userId: string) {
    
    const now = new Date().toISOString()

    const insertConversation = db.prepare(
        'INSERT OR IGNORE INTO conversations (id, created_by, created_at) VALUES (?, ?, ?)'
    )
    insertConversation.run(conversationId, userId, now)
    
    const insertConversationMembers = db.prepare(
        'INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)'
    )
    insertConversationMembers.run(conversationId, userId, now)
}

describe('POST /api/directMessage/:conversationId', () => {
    test('FR-14: allows an active member to send a message', async () => {
        
        // Arrange
        const conversationId = 'test-conversation-1'
        const userId = 'user_3'
        
        addTestConversation(conversationId, userId)

        // Act
        const response = await messageRoutes.handle(
            new Request('http://localhost:3000/api/directMessage/test-conversation-1?user_id=user_3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Hello from our test!' }),
            })
        )

        const savedMessages = db.prepare(
            'SELECT * FROM messages WHERE conversation_id = ?'
        ).all(conversationId)

        // Assert
        expect(response.status).toBe(201)
        expect(savedMessages).toHaveLength(1)   // expecting .all(conversationId) to return an array of 1
    })

    test('FR-14: User attempts to send a message to a conversation they don\'t belong to', async () => {
        // Arrange
        const conversationId = 'test-conversation-2'
        const userId = 'user_3'
        addTestConversation(conversationId, userId)
        const unauthUserId = 'user_4'

        // Act
        const response = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/directMessage/${conversationId}?user_id=${unauthUserId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Hello from test 2' }),
            })
        )
        const savedMessages = db.prepare(
            'SELECT * FROM messages WHERE conversation_id = ?'
        ).all(conversationId)

        // Assert
        expect(response.status).toBe(403)
        expect(savedMessages).toHaveLength(0)
    })
})