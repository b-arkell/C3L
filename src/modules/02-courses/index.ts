// index.ts
// The "brain" of module 2. It holds the course data and defines every route.
// All the HTML is in views.ts, all the CSS is in styles.ts - this file just
// wires them together with the data.
//
// Scope from the project brief:
//   - Create courses                  (done)
//   - Edit course information          (done)
//   - Course settings                  (only capacity so far, will extend later)
//   - Course catalog                   (done)
//   - Student enrollment               (done)
//   - Instructor assignment to courses (done)
//   - Archive active/inactive courses  (done)

import { Elysia } from 'elysia'
import { defineModule, moduleBase } from '../../core/defineModule'
import { docsPage } from './docsPage'
import {
  catalogPage,
  createPage,
  dashboardPage,
  editPage,
  notFoundPage,
  successPage,
  enrollPage,
  type Course,
  type CourseFormInput,    // new  
  type Instructor,
} from './views'

// Where module 2 is mounted, e.g. "/02-courses".
// I use this everywhere I need to build a link so nothing is hardcoded.
const base = moduleBase(import.meta.dir)

// ---- Data ----
// The course list is just an array in memory. It survives across requests
// while the server is running, but resets every time I restart `bun run dev`.
// That's fine for learning, obviously a real app would use a database.

const courses: Course[] = [
    {
        id: '1',
        code: 'PROG2020',
        title: 'Advanced Software Development Tools',
        description: 'Learning Git, Bun, and web development.',
        capacity: 30,
        enrollments: [],
        instructorId: null,
        archived: false,
    },
    {
        id: '2',
        code: 'CSCN72030',
        title: 'System Architecture',
        description: 'Designing backend systems and APIs.',
        capacity: 35,
        enrollments: [],
        instructorId: null,
        archived: false,
    },
]

// People who can be assigned to a course. Module 1 owns the real accounts and
// roles, and I'm not allowed to edit it, so for now this is a small fixed list.
// Later this could be fetched from module 1's users with the "instructor" role.
const instructors: Instructor[] = [
    { id: 'inst-1', name: 'Dr. Ada Lovelace' },
    { id: 'inst-2', name: 'Prof. Alan Turing' },
    { id: 'inst-3', name: 'Prof. Grace Hopper' },
]

// Small helpers so I don't write the same find/loop everywhere.

const findCourse = (id: string): Course | undefined =>
    courses.find((c) => c.id === id)

const findInstructor = (id: string): Instructor | undefined =>
    instructors.find((i) => i.id === id)

// Sets (or clears) the instructor on a course.
//   - instructorId === null  -> unassign
//   - unknown instructor id  -> 'invalid-instructor', nothing changes
//   - unknown course id      -> 'not-found'
// Returning a small status string keeps the route below easy to read.
function assignInstructor(
    courseId: string,
    instructorId: string | null,
): 'ok' | 'not-found' | 'invalid-instructor' {
    const course = findCourse(courseId)
    if (!course) return 'not-found'
    if (instructorId !== null && !findInstructor(instructorId)) return 'invalid-instructor'
    course.instructorId = instructorId
    return 'ok'
}

function createCourse(input: CourseFormInput): Course {
    const course: Course = {
        id: crypto.randomUUID(),   // unique forever, no collision with seed '1'/'2'
        enrollments: [],
        instructorId: null,
        archived: false,
        ...input,
    }
    courses.push(course)
    return course
}

function updateCourse(id: string, input: CourseFormInput): Course | undefined {
    const course = findCourse(id)
    if (!course) return undefined
    // Only form fields get copied — enrollments/instructor/archived are untouched.
    Object.assign(course, input)
    return course
}
// Grabs the fields out of the submitted <form> in one place, so POST /create
// and POST /:id/edit share the exact same parsing. Also normalises the types:
// form values are always strings, so capacity has to be converted to Number.
async function readCourseForm(request: Request): Promise<CourseFormInput> {
    const form = await request.formData()
    return {
        code: String(form.get('code') ?? '').trim(),
        title: String(form.get('title') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
        capacity: Number(form.get('capacity') ?? 0),
    }
}

// ---- Routes ----
// Each route is just: call a view function with the data it needs.
// The functions themselves are in views.ts.

export default defineModule({
  name: 'Module 2: Course Management',
  description: 'Courses, catalog, enrollment',

  router: new Elysia()
    // dashboard
    // query comes pre-parsed by Elysia — it's an object of all query-string params, 
    // so ?archived=1 becomes { archived: '1' }, and query.archived is the string '1'
    .get('/', ({ query }) => {
      const showArchived = query.archived === '1'
      return dashboardPage(base, courses, showArchived)
    })

    // read-only catalog
    .get('/catalog', () => catalogPage(base, courses))

    // show the "create a course" form
    .get('/create', () => createPage(base))

    // handle the form submit. After saving we show a success page.
    .post('/create', async ({ request }) => {
      createCourse(await readCourseForm(request))
      return successPage(base, 'Course Created Successfully!')
    })

    // show the edit form for one course
    .get('/:id/edit', ({ params }) => {
      const course = findCourse(params.id)
      if (!course) return notFoundPage(base)
      return editPage(base, course, instructors)   // ← keep main's version (3rd arg)
    })

    // handle the edit form submit
    .post('/:id/edit', async ({ params, request }) => {
      const updated = updateCourse(params.id, await readCourseForm(request))
      if (!updated) return notFoundPage(base)
      return successPage(base, 'Course Updated Successfully!')
    })

    // handle the instructor picker. An empty value means "Unassigned".  ← from main
    .post('/:id/assign-instructor', async ({ params, request, set }) => {
      const form = await request.formData()
      const value = String(form.get('instructorId') ?? '').trim()

      const result = assignInstructor(params.id, value === '' ? null : value)
      if (result === 'not-found') {
        set.status = 404
        return notFoundPage(base)
      }
      if (result === 'invalid-instructor') {
        set.status = 400
        return notFoundPage(base, 'Instructor not found')
      }
      return successPage(base, 'Instructor Assigned Successfully!')
    })

    // enrollment page (list + per-course enroll forms)  ← from A
    .get('/enroll', () => enrollPage(base, courses))

    // handle the enroll form submit  ← from A
    .post('/:id/enroll', async ({ params, request }) => {
      const course = findCourse(params.id)
      if (!course) return notFoundPage(base)

      const form = await request.formData()
      const studentId = String(form.get('studentId') ?? '').trim()

      if (!studentId) return notFoundPage(base, 'Student ID is required')
      if (course.enrollments.includes(studentId))
        return notFoundPage(base, 'Student is already enrolled')
      if (course.enrollments.length >= course.capacity)
        return notFoundPage(base, 'Course is full')

      course.enrollments.push(studentId)
      return successPage(base, 'Student Enrolled Successfully!')
    })

    // ---- Archive ----
    // Two tiny routes so archiving and un-archiving use the same pattern.
    // The dashboard hides archived courses by default; this toggles the flag.

    .post('/:id/archive', ({ params, set }) => {
      const course = findCourse(params.id)
      if (!course) {
        set.status = 404
        return notFoundPage(base)
      }
      course.archived = true
      return successPage(base, `${course.code} archived`)
    })

    .post('/:id/unarchive', ({ params, set }) => {
      const course = findCourse(params.id)
      if (!course) {
        set.status = 404   // Uses set.status = 404 for missing course, same pattern as assign-instructor
        return notFoundPage(base)
      }
      course.archived = false
      return successPage(base, `${course.code} restored to active`)
    })

    // Serve the OpenAPI spec file so Swagger UI can fetch it.
    .get('/openapi.yaml', () =>
      Bun.file(`${import.meta.dir}/openapi.yaml`)
    )

    // Swagger UI page that renders the above spec.
    // Modelled on Module 8's /08-notifications/docs.
    .get('/docs', () => docsPage(base))

    // JSON endpoint - other modules can call this later if they need the
    // course list (e.g. for enrollment or analytics).
    .get('/api/courses', () => ({ courses })),
})