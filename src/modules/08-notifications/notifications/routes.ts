import { Elysia, t } from 'elysia'
import { escapeHtml } from '../../../core/pages'
import { auth } from '../auth'
import { page } from '../views'
import { EVENT_TYPES } from './eventTypes'
import { checkEventRules } from './eventRules'

export const notificationRoutes = new Elysia()
  .onError(({error, code}) => {
    if (code === 'VALIDATION')
        return error.detail(error.message)
  })
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
  .post('api/notifications/subscribe', 
    ({body, set}) => {
      console.log('Receiving subscribe request to event:', body.event_type)
      // TODO: Body validated against DP-01 (course_id string; event_type array of allowed values, at least one)
      set.status = 204
    },
    {
      body: t.Object({
        course_id: t.String(),
        event_type: t.UnionEnum(EVENT_TYPES),
      }),
    },
  )



