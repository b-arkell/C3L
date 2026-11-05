import { Elysia } from 'elysia'
import { defineModule, moduleBase } from '../../core/defineModule'
import { messageRoutes } from './messages/routes'
import { notificationRoutes } from './notifications/routes'
import { page } from './views'

const base = moduleBase(import.meta.dir)

export default defineModule({
  name: 'Module 8: Notifications & Messaging',
  description: 'Announcements, notifications, direct messages',

  router: new Elysia()
    .get('/', () =>
      page(
        'Notifications & Messaging',
        `<style>
          .btns { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
          .btns a { padding: 8px 14px; border: 1px solid #888; border-radius: 4px;
                    text-decoration: none; color: inherit; }
          .btns a:hover { background: #eee; }
        </style>
        <h1>Notifications & Messaging</h1>

        <h2>Pages</h2>
        <div class="btns">
          <a href="${base}/inbox">Notification inbox</a>
          <a href="${base}/preferences">Notification preferences</a>
          <a href="${base}/messages">Messages</a>
        </div>

        <h2>API (GET, opens JSON)</h2>
        <div class="btns">
          <a href="${base}/api/users/me/notificationPreferences">My notification preferences</a>
          <a href="${base}/api/courses/course-101/announcements">Announcements for course-101</a>
        </div>

        <h2>API docs (test POST / PATCH here)</h2>
        <div class="btns">
          <a href="${base}/docs">Swagger docs</a>
          <a href="${base}/openapi.yaml">openapi.yaml</a>
        </div>`,
      ),
    )
    // The API spec file
    .get(
      '/openapi.yaml',
      () =>
        new Response(Bun.file(`${import.meta.dir}/openapi.yaml`), {
          headers: { 'Content-Type': 'application/yaml' },
        }),
    )
    // Interactive API docs
    .get(
      '/docs',
      () => `
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
        <div id="swagger"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>SwaggerUIBundle({ url: '${base}/openapi.yaml', dom_id: '#swagger' })</script>
      `,
    )
    .use(notificationRoutes)
    .use(messageRoutes),
})
