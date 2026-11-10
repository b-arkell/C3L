import { describe, expect, test } from 'bun:test'
import { moduleCreateRoutes } from './module.create.routes'
import type { LearningModule } from './module.model'
import { getLearningModulesByCourse } from './module.service'

const uniqueCourseId = () => `create-test-${crypto.randomUUID()}`
const postRaw = (courseId: string, body?: string) =>
  moduleCreateRoutes.handle(
    new Request(`http://localhost/api/courses/${encodeURIComponent(courseId)}/modules`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }),
  )
const post = (courseId: string, body: unknown) => postRaw(courseId, JSON.stringify(body))

describe('Learning-module creation API', () => {
  test('creates a module using the URL course ID and shares service storage', async () => {
    const courseId = uniqueCourseId()
    const bodyCourseId = uniqueCourseId()
    const response = await post(courseId, { title: ' Introduction ', courseId: bodyCourseId })
    const body = (await response.json()) as { module: LearningModule }

    expect(response.status).toBe(201)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(body.module.title).toBe('Introduction')
    expect(body.module.courseId).toBe(courseId)
    expect(body.module.id).toBeTruthy()
    expect(Number.isNaN(Date.parse(body.module.createdAt))).toBe(false)
    expect(getLearningModulesByCourse(courseId)).toEqual([body.module])
    expect(getLearningModulesByCourse(bodyCourseId)).toEqual([])
  })

  test('accepts and normalizes optional fields', async () => {
    const courseId = uniqueCourseId()
    const response = await post(` ${courseId} `, {
      title: 'Module', description: ' Description ', week: 2, topic: ' Topic ',
    })
    const body = (await response.json()) as { module: LearningModule }

    expect(response.status).toBe(201)
    expect(body.module).toMatchObject({
      courseId, title: 'Module', description: 'Description', week: 2, topic: 'Topic',
    })
    expect(getLearningModulesByCourse(courseId)).toEqual([body.module])
  })

  test.each([
    [{}, 'Module title is required'],
    [{ title: '' }, 'Module title is required'],
    [{ title: ' \t\n' }, 'Module title is required'],
    [{ title: 12 }, 'Module title is required'],
    [{ title: null }, 'Module title is required'],
    [{ title: 'Module', week: 0 }, 'Week must be a positive integer'],
    [{ title: 'Module', week: -1 }, 'Week must be a positive integer'],
    [{ title: 'Module', week: 1.5 }, 'Week must be a positive integer'],
    [{ title: 'Module', week: '2' }, 'Week must be a positive integer'],
    [{ title: 'Module', week: null }, 'Week must be a positive integer'],
    [{ title: 'Module', description: 42 }, 'Description must be a string'],
    [{ title: 'Module', topic: false }, 'Topic must be a string'],
  ])('rejects invalid fields %j', async (input, error) => {
    const courseId = uniqueCourseId()
    const response = await post(courseId, input)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error })
    expect(getLearningModulesByCourse(courseId)).toEqual([])
  })

  test('rejects a whitespace-only URL course ID even with a valid body course ID', async () => {
    const courseId = uniqueCourseId()
    const response = await post(' \t', { title: 'Module', courseId })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Course ID is required' })
    expect(getLearningModulesByCourse(courseId)).toEqual([])
  })

  test.each([
    [undefined, 'Request body must contain valid JSON'],
    ['', 'Request body must contain valid JSON'],
    ['{"title":', 'Request body must contain valid JSON'],
    ['null', 'Request body must be a JSON object'],
    ['[]', 'Request body must be a JSON object'],
    ['"text"', 'Request body must be a JSON object'],
    ['12', 'Request body must be a JSON object'],
    ['true', 'Request body must be a JSON object'],
  ])('safely rejects malformed or non-object body %j', async (input, error) => {
    const courseId = uniqueCourseId()
    const response = await postRaw(courseId, input)

    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ error })
    expect(getLearningModulesByCourse(courseId)).toEqual([])
  })
})
