import { describe, expect, test } from 'bun:test'
import { db } from '../../db/database'
import { messageRoutes } from '../routes'
import { retrieveConversation, type Conversation } from '../repository'


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

    test('FR-14: User attempts to send a message to a conversation that doesn\'t exist', async () => {
        // Arrange
        const conversationId = 'test-conversation-3'
        const userId = 'user_3'
        //addTestConversation(conversationId, userId) // a conversation needs to exist or the test fails. I think from some SQL return of null maybe
        //const wrongConvoId = 'test-wrongConvo-1'
        // Act
        const response = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/directMessage/${conversationId}?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Hello form test 3' }),
            }) 
        )
        const savedMessages = db.prepare(
            'SELECT * FROM messages WHERE conversation_id = ?'
        ).all(conversationId)

        // Assert
        expect(response.status).toBe(404)
        expect(savedMessages).toHaveLength(0)
    })

    test('FR-14: User sends an empty message body', async () => {
        // Arrange
        const conversationId = 'test-conversation-4'
        const userId = 'user_3'
        addTestConversation(conversationId, userId)

        // Act
        const response = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/directMessage/${conversationId}?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '' }),
            })
        )
        //console.log(response.status)
        const savedMessages = db.prepare(
            'SELECT * FROM messages WHERE conversation_id = ?'
        ).all(conversationId)

        // Assert
        expect(response.status).toBe(422)
        expect(savedMessages).toHaveLength(0)
    })

    test('FR-14: User sends a message body greater than 280', async () => {
        // Arrange
        const conversationId = 'test-conversation-5'
        const userId = 'user_3'
        addTestConversation(conversationId, userId)
        const longMessage = 'a'.repeat(281)

        // Act
        const response = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/directMessage/${conversationId}?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `${longMessage}` }),
            })
        )
        const savedMessages = db.prepare(
            'SELECT * FROM messages WHERE conversation_id = ?'
        ).all(conversationId)

        // Assert
        expect(response.status).toBe(422)
        expect(savedMessages).toHaveLength(0)
    })

    test('FR-14: Verifying the JSON response body for a successful message', async () => {
        // Arrange
        const conversationId = 'test-conversation-6'
        const userId = 'user_3'
        addTestConversation(conversationId, userId)
        const message = 'This is a successful message'

        // Act
        const response = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/directMessage/${conversationId}?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message }),
            })
        )
        const responseBody = await response.json()

        // Assert
        expect(response.status).toBe(201)
        expect(responseBody).toMatchObject({
            conversation_id: conversationId,
            sender_id: userId,
            body: message
        })
        expect(responseBody).toHaveProperty('id')
        expect(responseBody).toHaveProperty('created_at')
    })
})

describe ('[FR-17] Message storage', () => {
    test('FR-17: User sends 2 messages successfully. 2 separate record returned', async() => {
        // Arrange
        const conversationId = 'test-conversation-7'
        const userId = 'user_3'
        addTestConversation(conversationId, userId)
        const message1 = 'This is the first successful message to the same conversation id '
        const message2 = 'This is the second successful message to the same conversation id '

        // Act
        const response1 = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/directMessage/${conversationId}?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message1 }),
            })
        )
        const response2 = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/directMessage/${conversationId}?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message2 }),
            })
        )
        
        const responseBody1 = await response1.json() as { id: string }
        const responseBody2 = await response2.json() as { id: string }
        const stmt = db.prepare(
            'SELECT * FROM messages WHERE conversation_id = ?'
        ).all(conversationId)

        // Assert
        expect(response1.status).toBe(201)
        expect(response2.status).toBe(201)
        expect(stmt).toHaveLength(2)    // to messages sent with the same conversation ID returns 2 rows, 1 for each message
        // responseBody1 properties
        expect(responseBody1).toHaveProperty('conversation_id')
        expect(responseBody1).toHaveProperty('sender_id')
        expect(responseBody1).toHaveProperty('body')
        expect(responseBody1).toHaveProperty('created_at')
        // responseBody2 properties
        expect(responseBody2).toHaveProperty('conversation_id')
        expect(responseBody2).toHaveProperty('sender_id')
        expect(responseBody2).toHaveProperty('body')
        expect(responseBody2).toHaveProperty('created_at')
        // message id comparisons
        expect(responseBody1).toHaveProperty('id')
        expect(responseBody2).toHaveProperty('id')
        expect(responseBody1.id).not.toBe(responseBody2.id)
    })

    // write test for Foreign key from messages.conversation_id to conversations
    test('FR-17: Foreign key from messages.conversation_id to conversations', async () => {
        // Arrange
        const conversationId = 'test-conversation-8'
        const userId = 'user_3'
        addTestConversation(conversationId, userId)
        const message = 'Testing for messages.conversation_id = conversations.id'

        // Act
        const response = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/directMessage/${conversationId}?user_id=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message }),
            })
        )
        const responseBody = await response.json() as { conversation_id: string, id: string }
        const selectStmt = db.prepare(
            'SELECT * FROM conversations WHERE id = ?'
        ).all(responseBody.conversation_id)

        const joinStmt = db.prepare(
            'SELECT messages.* FROM messages INNER JOIN conversations ON messages.conversation_id = conversations.id WHERE messages.id = ?'
        ).all(responseBody.id)

        // Assert
        expect(selectStmt).toHaveLength(1)
        expect(joinStmt).toHaveLength(1)
    })

    // write test Message is stored once per conversation, not copied per member
    test('FR-17: Message is stored once per conversation, not copied per member', async () => {
        // Arrange
        const conversationId = 'test-conversation-9'
        const userId1 = 'user_3'
        const userId2 = 'user_4'
        const userId3 = 'user_5'
        addTestConversation(conversationId, userId1)
        const message = 'Testing for message records are stored per convo not per member'
        const now = new Date().toISOString()
        const insertConversationMembers = db.prepare(
        'INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)'
        )
        insertConversationMembers.run(conversationId, userId2, now)
        insertConversationMembers.run(conversationId, userId3, now)

        // Act
        await messageRoutes.handle(
            new Request(`http://localhost:3000/api/directMessage/${conversationId}?user_id=${userId1}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message }),
            })
        )
        const members = db.prepare(
            'SELECT * FROM conversation_members WHERE conversation_id = ?'
        ).all(conversationId)
        const messages = db.prepare(
            'SELECT * FROM messages WHERE conversation_id = ?'
        ).all(conversationId)

        // Assert
        expect(members).toHaveLength(3)
        expect(messages).toHaveLength(1)
    })
})

describe ('[FR-16] List conversations', () => {
    test('FR-16a: testing the database retrieval function', async () => {
        // Arrange
        const conversationId1 = 'test-conversation-10'
        const conversationId2 = 'test-conversation-11'
        const userId1 = 'user_6'
        const userId2 = 'user_7'
        addTestConversation(conversationId1, userId1)
        addTestConversation(conversationId2, userId1)
        const now = new Date().toISOString()
        const insertConversationMembers = db.prepare(
        'INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)'
        )
        insertConversationMembers.run(conversationId1, userId2, now)
        
        // Act
        const conversations1 = retrieveConversation(userId1)
        const conversations2 = retrieveConversation(userId2)

        // Assert
        expect(conversations1).toHaveLength(2)
        expect(conversations2).toHaveLength(1)
    })

    test('FR-16a: testing the HTTP endpoint', async () => {
        // Arrange
        const conversationId1 = 'test-conversation-12'
        const conversationId2 = 'test-conversation-13'
        const userId1 = 'user_8'
        const userId2 = 'user_9'
        addTestConversation(conversationId1, userId1)
        addTestConversation(conversationId2, userId1)
        const now = new Date().toISOString()
        const insertConversationMembers = db.prepare(
        'INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)'
        )
        insertConversationMembers.run(conversationId1, userId2, now)
        
        // Act
        const response = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/me/conversations?user_id=${userId1}`, {
                method: 'GET',
            })
        )
        const response2 = await messageRoutes.handle(
            new Request(`http://localhost:3000/api/me/conversations?user_id=${userId2}`, {
                method: 'GET',
            })
        )
        const responseBody = await response.json() as Conversation[]
        const responseBody2 = await response2.json() as Conversation[]

        // Assert
        expect(response.status).toBe(200)
        expect(responseBody).toHaveLength(2)
        expect(responseBody.map(c => c.id)).toContain(conversationId1)
        expect(responseBody.map(c => c.id)).toContain(conversationId2)
        expect(response.status).toBe(200)
        expect(responseBody2).toHaveLength(1)
        expect(responseBody2.map(c => c.id)).toContain(conversationId1)
        expect(responseBody2.map(c => c.id)).not.toContain(conversationId2)
    })

    //FR-16
    //TODO: test for group name after group creation is implemented.
    //TODO: test for unread flag per conversation from FR-18 (feeds US-05)
})

// FR-15 Leave conversation via PATCH /api/directMessage/unsubscribe/:conversation_id
// //TODO: test for conversation_members.left_at to check that the conversation disappears from their GET results
    // test('test for conversation_members.left_at to check that the conversation disappears from their GET results', async () => {
    //     // Arrange 
    //     const conversationId1 = 'test-conversation-14'
    //     const conversationId2 = 'test-conversation-15'
    //     const userId1 = 'user_10'
    //     const userId2 = 'user_11'
    //     addTestConversation(conversationId1, userId1)
    //     addTestConversation(conversationId2, userId1)
    //     const now = new Date().toISOString()
    //     const insertConversationMembers = db.prepare(
    //     'INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)'
    //     )
    //     insertConversationMembers.run(conversationId1, userId2, now)

    //     // Act
    //     const response = await messageRoutes.handle(
    //         new Request(`http://localhost:3000/api/me/conversations?user_id=${userId1}`, {
    //             method: 'GET',
    //         })
    //     )

    //     const response2 = await messageRoutes.handle(
    //         new Request(`http://localhost:3000/api/me/conversations?user_id=${userId1}`, {
    //             method: 'GET',
    //         })
    //     )
    //     const responseBody = await response.json() as Conversation[]
    //     const responseBody2 = await response2.json() as Conversation[]
    // })