import { Elysia, t } from 'elysia'
import { escapeHtml } from '../../../core/pages'
import { auth } from '../auth'
import { page } from '../views'
import { EVENT_TYPES } from './eventTypes'

export const notificationRoutes = new Elysia()
  .use(auth)
  .get('/inbox', ({ user }) =>
    page(
      'Notifications',
      `<h1>Notifications</h1>
      <p>Signed in as ${escapeHtml(user.user_id)}. Coming soon.</p>`,
    ),
  )
  .get('/preferences', () =>
    page('Notification settings', '<h1>Notification settings</h1><p>Coming soon.</p>'),
  )
  .post( 'api/notifications/events',
    ({body, set}) => {
      console.log('Event received:', body.event_type, body.course_id)
      set.status = 204
    },
    {
      body: t.Object({
        event_type: t.UnionEnum(EVENT_TYPES),
        course_id: t.String(),
        user_ids: t.Optional(t.Array(t.String())),
        content: t.Object({
          subject: t.String(),
          message: t.String(),
        }),
      }),
    },
  )



