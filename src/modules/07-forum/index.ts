// MODULE 7: Discussion Forum System
//
// Scope from the project brief:
//   - Create discussion boards
//   - Create topics
//   - Post replies
//   - Threaded discussions
//   - Edit/delete posts
//   - Moderation functionality
//
// HOW TO ADD A PAGE TO THE ROUTER (basic demo):
//   1. Find the router at the bottom of this file.
//   2. Copy the  .get('/hello', ...)  line.
//   3. Change the address ('/hello') and the HTML it returns.
//   4. Save. Your new page is at  http://localhost:3000/07-forum/<your-address>
import { Elysia } from 'elysia'
import { defineModule, moduleBase } from '../../core/defineModule'
import { forwardRequest } from './forward'

const base = moduleBase(import.meta.dir)

console.log('Module 7 base path:', base)

export default defineModule({
    name: 'Module 7: Discussion Forum System',
    description: 'Boards, topics, threaded replies',

    router: new Elysia()
        .get(
            '/',
            () => `
        <h1>Module 7: Discussion Forum System</h1>
        <p>Welcome to the Discussion Forum.</p>
        <p><a href="http://localhost:5098/DiscussionBoard">Open Discussion Forum</a></p>
        <p><a href="${base}/hello">Demo page</a></p>
      `,
        )
        .get(
            '/hello',
            () => `<h1>Hello from Module 7</h1><a href="${base}">Back</a>`,
        )
        .all(
            '/api/*',
            ({ request }) =>
                forwardRequest(request, {
                    target: 'http://localhost:5098',
                    stripPrefix: '',
                }),
            { parse: 'none' },
        ),
})