import { Elysia, t } from 'elysia'
import { escapeHtml } from '../../../core/pages'
import { auth } from '../auth'
import { page } from '../views'
import { EVENT_TYPES } from './eventTypes'
import { checkEventRules } from './eventRules'

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
  .onError(({code, set}) => {
    if (code === 'VALIDATION') {
      set.status = 400
      return { error: 'Request body does not match the expected format'}
    }
  })
  .post( 'api/notifications/events',
    ({body, set}) => {
      const problem = checkEventRules(body)
      if (problem){
        set.status = 400
        return {error: problem}
      }
      console.log('Event received:', body.event_type, body.course_id)
      set.status = 204
    },
    {
      body: t.Object({
        event_type: t.UnionEnum(EVENT_TYPES),
        course_id: t.String(),
        user_ids: t.Optional(t.Array(t.String())),
        content: t.Object({
          subject: t.String({minLength: 1, maxLength: 50}),
          message: t.String({minLength: 1, maxLength: 280}),
        }),
      }),
    },
  )



