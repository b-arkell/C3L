import { Elysia, t } from 'elysia'
import { escapeHtml } from '../../../core/pages'
import { auth } from '../auth'
import { page } from '../views'
import { EVENT_TYPES } from './eventTypes'
import { checkEventRules } from './eventRules'
import { unmuteCategories } from './subscribe'
import { muteCategories } from './unsubscribe'
import { getAnnouncements } from './announcements'
import { courseExists, enrolledCourses, courseMembers } from './courses'
import { preferencesPage } from './preferencesPage'
import { getPreferences } from './preferences'
import { storeNotification } from './storeNotification'
import { removeMutedUsers } from './muteFilter'
import { getNotifications } from './getNotifications'
import { markNotificationRead } from './markNotificationRead'

export const notificationRoutes = new Elysia()
  .use(auth)
  .get('/inbox', ({ user }) =>
    page(
      'Notifications',
      `<h1>Notifications</h1>
      <p>Signed in as ${escapeHtml(user.user_id)}. Coming soon.</p>`,
    ),
  )
  .get('/preferences', ({ user }) => preferencesPage(user.user_id))
  .get('/assets/logo.png', () => Bun.file(`${import.meta.dir}/../assets/logo.png`))
  .onError(({ code, set }) => {
    if (code === 'VALIDATION') {
      set.status = 400
      return { error: 'Request body does not match the expected format' }
    }
  })
  .get('api/courses/:course_id/announcements', ({params, set}) => {
    if (!courseExists(params.course_id)) {
      set.status = 404
      return { error: `Course "${params.course_id}" does not exist` }
    }
      return getAnnouncements(params.course_id)
  })
  .post( 'api/notifications/events',
    ({body, set}) => {
      const problem = checkEventRules(body)
      if (problem){
        set.status = 400
        return {error: problem}
      }
      const recipients = removeMutedUsers( // remove any muted users from the list
        body.user_ids ?? courseMembers(body.course_id), // get the users in the course
        body.course_id,
        body.event_type,
      ) 
      storeNotification(body, recipients) // store the notification in db and the recipients
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
    ({body, set, user}) => {
        console.log('Received subscribe request to event:', body.event_type)
      unmuteCategories(user.user_id, body)
      set.status = 204
    },
    {
      body: t.Object({
        course_id: t.String({minLength: 1}),
        event_type: t.Array(t.UnionEnum(EVENT_TYPES), { minItems: 1 }),
      }),
    },
  )
  .patch('api/notifications/unsubscribe', 
    ({body, set, user}) => {
      console.log('Received unsubscribe request to event:', body.event_type)
      muteCategories(user.user_id, body)
      set.status = 204
    },
    {
      body: t.Object({
        course_id: t.String({minLength: 1}),
        event_type: t.Array(t.UnionEnum(EVENT_TYPES), { minItems: 1 }),
      }),
    },
  )
  .get('api/users/me/notificationPreferences', ({ user }) => {
      return getPreferences(user.user_id, enrolledCourses(user.user_id))
  })
  .get('api/users/me/notifications',
    ({ user, query }) =>
      getNotifications(user.user_id, query.limit),
    {
      query: t.Object({
        limit: t.Optional(
          t.Number({ 
            minimum: 1,
            maximum: 100,
           }),
        )
      }),
    },
  )
  .patch('api/notifications/:notificationId',
    ({ user, params, set }) => {
      const result = markNotificationRead(user.user_id, params.notificationId)

      if (result === 'not-found') {
        set.status = 404
        return {error: 'Notification not found'}
      }
      if (result === 'forbidden'){
        set.status = 403
        return {error: 'Notification does not belong to the current user'}
      }
      
      set.status = 204
    },
    {
      body: t.Object({
        read: t.Literal(true)
      }),
    },
  )