// index.test.ts
// Very small tests for module 2. Bun has a built-in test runner so we don't
// need jest or anything - just import test and expect from 'bun:test'.
//
// `mod.router.handle(...)` runs the router as if a real request came in, so we
// can check status codes and the HTML that comes back.

import { expect, test } from 'bun:test'
import mod from './index'

// Shortcut so I don't have to write the full Request each time.
// Reminder: inside the tests, routes start at "/" - the /02-courses part is
// added by the main app, so we don't include it here.
const get = (path: string) =>
    mod.router.handle(new Request(`http://localhost${path}`))

test('Module 2 dashboard loads', async () => {
    const response = await get('/')
    expect(response.status).toBe(200)
    // Just check it contains the heading - I don't want to lock the test to
    // the exact HTML in case I change the layout later.
    expect(await response.text()).toContain('Course Management')
})

test('Course catalog loads', async () => {
    const response = await get('/catalog')
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Course Catalog')
})

test('JSON API works', async () => {
    const response = await get('/api/courses')
    expect(response.status).toBe(200)

    const data = (await response.json()) as {
        courses: Array<{ id: string; code: string; title: string }>
    }
    expect(Array.isArray(data.courses)).toBe(true)
    expect(data.courses.length).toBeGreaterThan(0)
})
// ---- Instructor assignment ----
// Helpers for the assign-instructor tests. The course data lives in memory, so
// these tests use the seeded course '1' and read the result back through the
// JSON API to check the data really changed (not just the page text).

const postForm = (path: string, fields: Record<string, string>) =>
    mod.router.handle(
        new Request(`http://localhost${path}`, {
            method: 'POST',
            body: new URLSearchParams(fields),
        }),
    )

type ApiCourse = { id: string; instructorId: string | null }

const instructorOf = async (id: string) => {
    const data = (await (await get('/api/courses')).json()) as { courses: ApiCourse[] }
    return data.courses.find((c) => c.id === id)?.instructorId
}

test('Edit page shows the instructor picker', async () => {
    const response = await get('/1/edit')
    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain('name="instructorId"')
    expect(html).toContain('/1/assign-instructor')
    expect(html).toContain('Unassigned')
    expect(html).toContain('Dr. Ada Lovelace')
})

test('Assigning an instructor saves it on the course', async () => {
    const response = await postForm('/1/assign-instructor', { instructorId: 'inst-2' })
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Instructor Assigned Successfully')
    expect(await instructorOf('1')).toBe('inst-2')

    // the edit page now pre-selects that instructor
    const html = await (await get('/1/edit')).text()
    expect(html).toContain('value="inst-2" selected')
})

test('Choosing "Unassigned" clears the instructor', async () => {
    await postForm('/1/assign-instructor', { instructorId: 'inst-1' })
    expect(await instructorOf('1')).toBe('inst-1')

    const response = await postForm('/1/assign-instructor', { instructorId: '' })
    expect(response.status).toBe(200)
    expect(await instructorOf('1')).toBeNull()
})

test('Assigning an unknown instructor is rejected and changes nothing', async () => {
    await postForm('/1/assign-instructor', { instructorId: 'inst-3' })

    const response = await postForm('/1/assign-instructor', { instructorId: 'nobody' })
    expect(response.status).toBe(400)
    expect(await response.text()).toContain('Instructor not found')
    expect(await instructorOf('1')).toBe('inst-3')
})

test('Assigning an instructor to a missing course returns 404', async () => {
    const response = await postForm('/does-not-exist/assign-instructor', { instructorId: 'inst-1' })
    expect(response.status).toBe(404)
    expect(await response.text()).toContain('Course not found')
})

test('Editing course details does not wipe the assigned instructor', async () => {
    await postForm('/2/assign-instructor', { instructorId: 'inst-1' })

    await postForm('/2/edit', {
        code: 'CSCN72030',
        title: 'System Architecture',
        description: 'Designing backend systems and APIs.',
        capacity: '40',
    })
    expect(await instructorOf('2')).toBe('inst-1')
})

test('Edit page form has every course field, so saving it keeps them', async () => {
    const html = await (await get('/2/edit')).text()
    // only look at the first form (the course form), not the instructor picker
    const courseForm = html.split('</form>')[0] ?? ''

    for (const name of ['code', 'title', 'description', 'capacity']) {
        expect(courseForm).toContain(`name="${name}"`)
    }

    // Submit the form the way a browser would: send exactly the fields the HTML
    // contains. If an input is missing from the page, it is missing here too,
    // and the course would lose that value.
    const fields: Record<string, string> = {}
    for (const m of courseForm.matchAll(/<input[^>]*name="(\w+)"[^>]*value="([^"]*)"/g)) {
        fields[m[1] as string] = m[2] as string
    }
    const textarea = courseForm.match(/<textarea name="description"[^>]*>([^<]*)<\/textarea>/)
    if (textarea) fields.description = textarea[1] as string

    const response = await postForm('/2/edit', fields)
    expect(response.status).toBe(200)

    const data = (await (await get('/api/courses')).json()) as {
        courses: Array<{ id: string; title: string; description: string }>
    }
    const course = data.courses.find((c) => c.id === '2')
    expect(course?.title).toBe('System Architecture')
    expect(course?.description).toBe('Designing backend systems and APIs.')
})

// ---- Archive ----

// Helper so I don't repeat the API-read boilerplate for every archive test.
const getCourse = async (id: string) => {
  const data = (await (await get('/api/courses')).json()) as {
    courses: Array<{ id: string; archived: boolean; capacity: number; enrollments: string[] }>
  }
  return data.courses.find((c) => c.id === id)
}

test('Archiving a course sets archived=true', async () => {
  const response = await postForm('/2/archive', {})
  expect(response.status).toBe(200)
  expect((await getCourse('2'))?.archived).toBe(true)
})

test('Unarchiving a course sets archived=false', async () => {
  await postForm('/2/archive', {})
  const response = await postForm('/2/unarchive', {})
  expect(response.status).toBe(200)
  expect((await getCourse('2'))?.archived).toBe(false)
})

test('Archiving an unknown course returns 404', async () => {
  const response = await postForm('/does-not-exist/archive', {})
  expect(response.status).toBe(404)
})

test('Archived courses are hidden from the dashboard by default', async () => {
  await postForm('/2/archive', {})
  const html = await (await get('/')).text()
  // course 1 is active, course 2 is archived - only course 1 should be visible
  expect(html).toContain('PROG2020')   // active course 1
  expect(html).not.toContain('CSCN72030')  // archived course 2
})

test('Archived courses appear with ?archived=1', async () => {
  await postForm('/2/archive', {})
  const html = await (await get('/?archived=1')).text()
  expect(html).toContain('PROG2020')   // active course 1 still shown
  expect(html).toContain('CSCN72030')  // archived course 2 now visible
  expect(html).toContain('ARCHIVED')   // the badge
})

test('Archived courses do not appear in the catalog', async () => {
  await postForm('/2/archive', {})
  const html = await (await get('/catalog')).text()
  expect(html).not.toContain('CSCN72030')
})

test('Archiving does not delete or change enrollments', async () => {
  // enroll a student first
  await postForm('/1/enroll', { studentId: 'student-x' })
  const before = await getCourse('1')
  expect(before?.enrollments).toEqual(['student-x'])

  await postForm('/1/archive', {})
  const after = await getCourse('1')
  expect(after?.archived).toBe(true)
  expect(after?.enrollments).toEqual(['student-x'])   // still there
})