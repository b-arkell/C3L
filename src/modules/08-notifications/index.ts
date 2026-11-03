import { Elysia } from 'elysia'
import { defineModule, moduleBase } from '../../core/defineModule'
import { messageRoutes } from './messages/routes'
import { notificationRoutes } from './notifications/routes'
import { page } from './views'

import { db, initializeDatabase } from './tutorial/database'
import { createNotification, markNotificationRead } from './tutorial/notifications'

const base = moduleBase(import.meta.dir)
await initializeDatabase()

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export default defineModule({
  name: 'Module 8: Notifications & Messaging',
  description: 'Announcements, notifications, direct messages',

  router: new Elysia()
    .get('/', () =>
      page(
        'Notifications & Messaging',
        `<h1>Notifications & Messaging</h1>
        <ul>
          <li><a href="${base}/inbox">Notifications</a></li>
          <li><a href="${base}/messages">Messages</a></li>
        </ul>`,
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
    
    .get('/tutorial', () => {
      const notifications = db.query(
        'SELECT * FROM tutorial_notifications'
      ).all() as { id: number; message: string; is_read: number }[]

      const notificationList = notifications.map(notification => `
          <li>
            ${escapeHtml(notification.message)}
            ${notification.is_read === 1 ? '(Read)' : '(Unread)'}
          </li>
        `)
        .join('')

      return `
        <h1>My Notification Center</h1>
        <p>Welcome to my TypeScript tutorial!</p>

        <form action="${base}/tutorial/notifications" method="POST">
          <label for="message">Notification message:</label>
          <input type="text" id="message" name="message" required>
          <button type="submit">Create Notification</button>
        </form>

        <h2>Notifications</h2>
        <ul>${notificationList}</ul>
      `
    })

    .get(
      '/tutorial/notifications',
      () => {
        return db.query(
          'SELECT * FROM tutorial_notifications'
        ).all()
      }
    )
    .post(
      '/tutorial/notifications', async ({ request }) => {
        const form = await request.formData()
        const message = form.get('message')

        if (typeof message !== 'string' || message.trim() === '') {
          return new Response('Invalid message', {status: 400 })
        }
        
        createNotification(message)

        return Response.redirect(
          `http://localhost:3000${base}/tutorial`,
          303
        )
      }
    )

    .use(notificationRoutes)
    .use(messageRoutes),
})
