import { Elysia } from 'elysia'
import { defineModule, moduleBase } from '../../core/defineModule'
import { messageRoutes } from './messages/routes'
import { notificationRoutes } from './notifications/routes'
import { page } from './views'
import { bellWidget } from './notifications/bellWidget'
import { demoRoutes } from './demo/routes'

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
          .demo-btn { display: inline-block; padding: 10px 22px; border-radius: 4px; background: #bd8f4d;
                      color: #262626; font-weight: 600; text-decoration: none; }
        </style>
        <h1>Notifications & Messaging</h1>
            <p><a class="demo-btn" href="${base}/demo">Start demo</a></p>
        <h2>Pages</h2>
        <div class="btns">
          <a href="${base}/inbox">Notification inbox</a>
          <a href="${base}/preferences">Notification preferences</a>
          <a href="${base}/messages">Messages</a>
          ${bellWidget(base)}
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
        </div>
        <script>
        (async () => {
          try {
            const response = await fetch(
              '${base}/api/users/me/notifications?limit=100'
            )

            if (!response.ok) {
              return
            }

            const notifications = await response.json()

            const hasUnread = notifications.some(
              notification => notification.read_at === null,
            )

            if (!hasUnread) {
              return
            }

            const dot = document.createElement('span')

            dot.style.position = 'absolute'
            dot.style.top = '1px'
            dot.style.right = '1px'
            dot.style.width = '8px'
            dot.style.height = '8px'
            dot.style.borderRadius = '50%'
            dot.style.backgroundColor = '#cc3333'

            document
              .getElementById('bell-link')
              .appendChild(dot)

          } catch {
            // Ignore failures
          }
        })()
        </script>`,
        
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
    .use(messageRoutes)
    .use(demoRoutes), // TODO - DEMO ONLY: remove later along with the demo/ folder
})
