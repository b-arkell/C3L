import { describe, expect, test } from 'bun:test'
import { moduleListRoutes } from './module.list.routes'
import type { LearningModule } from './module.model'
import { createLearningModule } from './module.service'

const uniqueCourseId = () => `list-test-${crypto.randomUUID()}`
const list = (courseId: string) =>
  moduleListRoutes.handle(
    new Request(`http://localhost/api/courses/${encodeURIComponent(courseId)}/modules`),
  )

describe('Course learning-module listing', () => {
  test('returns an empty JSON list for a course with no modules', async () => {
    const response = await list(uniqueCourseId())

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ modules: [] })
  })

  test('lists all modules created for a specific course', async () => {
    const courseId = uniqueCourseId()
    const first = createLearningModule({ courseId, title: 'Introduction' })
    const second = createLearningModule({ courseId, title: 'Next topic', week: 2 })

    const response = await list(courseId)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      modules: [JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second))],
    })
  })

  test('excludes modules belonging to another course', async () => {
    const courseId = uniqueCourseId()
    const own = createLearningModule({ courseId, title: 'Own course' })
    createLearningModule({ courseId: uniqueCourseId(), title: 'Other course' })

    const response = await list(courseId)
    const body = (await response.json()) as { modules: LearningModule[] }

    expect(response.status).toBe(200)
    expect(body.modules).toHaveLength(1)
    expect(body.modules[0].id).toBe(own.id)
    expect(body.modules[0].courseId).toBe(courseId)
  })

  test('sees a newly created module in shared memory and trims the course ID', async () => {
    const courseId = uniqueCourseId()
    expect(await (await list(courseId)).json()).toEqual({ modules: [] })

    const created = createLearningModule({
      courseId: ` ${courseId} `,
      title: ' Shared module ',
      description: 'Description',
      topic: 'Topic',
      week: 1,
    })
    const response = await list(` ${courseId} `)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ modules: [created] })
  })

  test.each([' ', '   ', '\t\n'])('rejects whitespace-only course ID %j', async (courseId) => {
    const response = await list(courseId)

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ error: 'Course ID must not be blank' })
  })
})
