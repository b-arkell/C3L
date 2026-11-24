import { beforeAll, expect, test } from 'bun:test'
import { useFakeUserForTests } from '../auth'
import mod from '../index'

// pick the user with ?user_id= instead of signing in through Module 1
beforeAll(useFakeUserForTests)

const call = (path: string, method = 'GET') =>
    mod.router.handle(new Request(`http://localhost${path}`, { method }))

test('demo start page has the register button', async () => {
    const res = await call('/demo')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Register demo user')
})

test('each demo section shows its real page in an iframe', async () => {
    for (const [section, path] of [['inbox', '/inbox'], ['preferences', '/preferences'], ['messages', '/messages']]) {
        const res = await call(`/demo/${section}?user_id=demo-1`)
        expect(res.status).toBe(200)
        expect(await res.text()).toContain(`src="/08-notifications${path}"`)
    }
})

test('unknown demo section is rejected', async () => {
    const res = await call('/demo/nope?user_id=demo-1')
    expect(res.status).toBe(404)
})

test('demo message arrives in a chat with the classmate', async () => {
    const res = await call('/api/demo/message?user_id=demo-2', 'POST')
    expect(res.status).toBe(201)

    const chats = await call('/api/me/conversations?user_id=demo-2')
    const list = (await chats.json()) as unknown[]
    expect(list.length).toBe(1)
})