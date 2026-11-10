import { Elysia } from 'elysia'
import { getLearningModulesByCourse } from './module.service'

// Provisional Sprint-1 API; mount on the module router after team coordination.
export const moduleListRoutes = new Elysia().get(
  '/api/courses/:courseId/modules',
  ({ params, set }) => {
    const courseId = params.courseId.trim()

    if (!courseId) {
      set.status = 400
      return { error: 'Course ID must not be blank' }
    }

    return { modules: getLearningModulesByCourse(courseId) }
  },
)
