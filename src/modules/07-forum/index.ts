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
       <p>
 <a href="http://localhost:30707/Courses">
    Course Discussion Boards
</a>
</p>
        <p><a href="${base}/hello">Demo page</a></p>
      `,
        )
        .get(
            '/hello',
            () => `<h1>Hello from Module 7</h1><a href="${base}">Back</a>`,
        )
       
.get(
    '/openapi.yaml',
    () =>
        new Response(Bun.file(`${import.meta.dir}/openapi.yaml`), {
            headers: { 'Content-Type': 'application/yaml' },
        }),
)
.get(
    '/docs',
    () => `
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
        <div id="swagger"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
            SwaggerUIBundle({
                url: '${base}/openapi.yaml',
                dom_id: '#swagger'
            })
        </script>
    `,
)

        .all(
    '/api/*',
    ({ request }) =>
        forwardRequest(request, {
            target: 'http://localhost:30707',
            stripPrefix: base,
        }),
    { parse: 'none' },
),
})