import { beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { useFakeUserForTests } from '../../auth'
import { db } from '../../db/database'
import { messageRoutes } from '../routes'

beforeAll(useFakeUserForTests)

beforeEach(() => {
    db.exec('DELETE FROM conversation_members')
    db.exec('DELETE FROM conversations')
})

describe('[FR-12] Create conversations', () => {

    test('creates a direct conversation', async () => {

        const response = await messageRoutes.handle(
            new Request(
                'http://localhost:3000/api/directMessageCreation?user_id=user_1',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipients_emails: ['user_2'],
                    }),
                },
            ),
        )

        const body = await response.json() as {
            conversation_id: string
        }

        const conversations = db.prepare(
            'SELECT * FROM conversations WHERE id = ?',
        ).all(body.conversation_id)

        const members = db.prepare(
            'SELECT * FROM conversation_members WHERE conversation_id = ?',
        ).all(body.conversation_id)

        expect(response.status).toBe(201)
        expect(conversations).toHaveLength(1)
        expect(members).toHaveLength(2)
    })

    test('creates a group conversation', async () => {

        const response = await messageRoutes.handle(
            new Request(
                'http://localhost:3000/api/directMessageCreation?user_id=user_1',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        group_name: 'Study Group',
                        recipients_emails: [
                            'user_2',
                            'user_3',
                        ],
                    }),
                },
            ),
        )

        const body = await response.json() as {
            conversation_id: string
        }

        const conversations = db.prepare(
            'SELECT * FROM conversations WHERE id = ?',
        ).all(body.conversation_id)

        const members = db.prepare(
            'SELECT * FROM conversation_members WHERE conversation_id = ?',
        ).all(body.conversation_id)

        expect(response.status).toBe(201)
        expect(conversations).toHaveLength(1)

        // creator + 2 recipients
        expect(members).toHaveLength(3)
    })

    test('rejects a group with no name', async () => {

        const response = await messageRoutes.handle(
            new Request(
                'http://localhost:3000/api/directMessageCreation?user_id=user_1',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipients_emails: [
                            'user_2',
                            'user_3',
                        ],
                    }),
                },
            ),
        )

        expect(response.status).toBe(400)
    })

    test('rejects an empty recipient list', async () => {

        const response = await messageRoutes.handle(
            new Request(
                'http://localhost:3000/api/directMessageCreation?user_id=user_1',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipients_emails: [],
                    }),
                },
            ),
        )

        // Elysia validation
        expect(response.status).toBe(422)
    })
})

describe('[FR-13] Prevent duplicate 1:1 conversations', () => {

    test('returns existing conversation instead of creating another', async () => {

        const response1 = await messageRoutes.handle(
            new Request(
                'http://localhost:3000/api/directMessageCreation?user_id=user_1',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipients_emails: ['user_2'],
                    }),
                },
            ),
        )

        const body1 = await response1.json() as {
            conversation_id: string
        }

        const response2 = await messageRoutes.handle(
            new Request(
                'http://localhost:3000/api/directMessageCreation?user_id=user_2',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipients_emails: ['user_1'],
                    }),
                },
            ),
        )

        const body2 = await response2.json() as {
            conversation_id: string
        }

        const conversations = db.prepare(
            'SELECT * FROM conversations',
        ).all()

        expect(body1.conversation_id)
            .toBe(body2.conversation_id)

        expect(conversations)
            .toHaveLength(1)
    })

    test('stores direct_key in sorted order', async () => {

        const response = await messageRoutes.handle(
            new Request(
                'http://localhost:3000/api/directMessageCreation?user_id=user_b',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        recipients_emails: ['user_a'],
                    }),
                },
            ),
        )

        const body = await response.json() as {
            conversation_id: string
        }

        const conversation = db.prepare(
            `
            SELECT direct_key
            FROM conversations
            WHERE id = ?
            `,
        ).get(body.conversation_id) as {
            direct_key: string
        }

        expect(conversation.direct_key)
            .toBe('user_a|user_b')
    })
})