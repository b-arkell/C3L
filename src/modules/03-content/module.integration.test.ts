import { expect, test } from 'bun:test'
import { createApp } from '../../app'
import type { LearningModule } from './module.model'

test('mounted Module 3 supports create then list with course isolation', async () => {
  const app = await createApp()
  const courseId = `DEMO-101-${crypto.randomUUID()}`
  const otherCourseId = `DEMO-OTHER-${crypto.randomUUID()}`
  const url = (id: string) => `http://localhost/03-content/api/courses/${id}/modules`
  const post = (id: string, title: string) =>
    app.fetch(new Request(url(id), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    }))

  const createdResponse = await post(courseId, 'Sprint-1 demonstration')
  expect(createdResponse.status).toBe(201)
  expect(createdResponse.headers.get('content-type')).toContain('application/json')
  const created = (await createdResponse.json()) as { module: LearningModule }
  expect(created.module).toMatchObject({ courseId, title: 'Sprint-1 demonstration' })
  expect(created.module.id).toBeTruthy()

  const otherResponse = await post(otherCourseId, 'Other course')
  expect(otherResponse.status).toBe(201)
  const other = (await otherResponse.json()) as { module: LearningModule }

  const listedResponse = await app.fetch(new Request(url(courseId)))
  expect(listedResponse.status).toBe(200)
  expect(listedResponse.headers.get('content-type')).toContain('application/json')
  expect(await listedResponse.json()).toEqual({ modules: [created.module] })

  const otherList = await app.fetch(new Request(url(otherCourseId)))
  expect(otherList.status).toBe(200)
  expect(await otherList.json()).toEqual({ modules: [other.module] })

  const invalidResponse = await post(courseId, '   ')
  expect(invalidResponse.status).toBe(400)
  expect(invalidResponse.headers.get('content-type')).toContain('application/json')
  expect(await invalidResponse.json()).toEqual({ error: 'Module title is required' })
  const afterInvalid = await app.fetch(new Request(url(courseId)))
  expect(await afterInvalid.json()).toEqual({ modules: [created.module] })

  for (const [path, text] of [
    ['/03-content', 'Module 3: Content Management'],
    ['/03-content/hello', 'Hello from Module 3'],
  ]) {
    const response = await app.fetch(new Request(`http://localhost${path}`))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain(text)
  }
})
