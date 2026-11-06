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
//   - Student enrollment               (not done yet)
//   - Instructor assignment to courses (not done yet)
//   - Archive active/inactive courses  (not done yet)

import { Elysia } from 'elysia'
import { defineModule, moduleBase } from '../../core/defineModule'
import {
  catalogPage,
  createPage,
  dashboardPage,
  editPage,
  notFoundPage,
  successPage,
  type Course,
  type CourseFormInput,    // new
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

// Small helpers so I don't write the same find/loop everywhere.

const findCourse = (id: string): Course | undefined =>
  courses.find((c) => c.id === id)

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
async function readCourseForm(request: Request): Promise<CourseFormInput>{
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
    .get('/', () => dashboardPage(base, courses))

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
      return editPage(base, course)
    })

    // handle the edit form submit
    .post('/:id/edit', async ({ params, request }) => {
      const updated = updateCourse(params.id, await readCourseForm(request))
      if (!updated) return notFoundPage(base)
      return successPage(base, 'Course Updated Successfully!')
    })

    // JSON endpoint - other modules can call this later if they need the
    // course list (e.g. for enrollment or analytics).
    .get('/api/courses', () => ({ courses })),
})