// views.ts
// Every page of module 2 is built by a function in this file.
// The idea is: give a function some data, get back a full HTML string.
// No routes, no data storage, no side effects - just strings in, string out.
//
// I put `base` as the first argument on every builder instead of importing it here.
// That way this file doesn't have to know where the module is mounted, and I can
// test these functions on their own if I want (e.g. dashboardPage('/x', []) etc.).

import { escapeHtml } from '../../core/pages'
import { CSS } from './styles'

// The Course type is declared here because views.ts is the first file that
// needs to know the shape. index.ts imports it from here (type-only import).

export type Course = {
  id: string
  code: string
  title: string
  description: string
  capacity: number
  enrollments: string[]          // student ids — empty for a new course
  instructorId: string | null    // null = no instructor assigned yet
  archived: boolean              // false = active, true = hidden from catalogs
}

// Just the fields a user submits through the <form>. Fields that the system
// manages (id, enrollments, instructor, archived) are deliberately not here
// so an edit can't accidentally clobber them.
export type CourseFormInput = {
  code: string
  title: string
  description: string
  capacity: number
}

// Shared page shell. Every other builder calls this so the <html>, <head> and
// <body> tags only exist in one place. Whatever HTML the page wants goes into
// the {{body}} slot.
//
// escapeHtml on the title just in case a course title has < or & in it.
function layout(opts: { base: string; pageTitle: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(opts.pageTitle)}</title>
    <style>${CSS}</style>
  </head>
  <body>
    <nav class="crumbs"><a href="/">← All modules</a></nav>
    <main>${opts.body}</main>
  </body>
</html>`
}

// ---- Page builders ----
// One function per page. Keep them simple: build the body, wrap in layout(),
// return. If I need to change what a page looks like, I only touch one function.

// Dashboard: list of all courses as cards, plus the two action buttons.
export function dashboardPage(base: string, courses: Course[]): string {
  // .map + .join is basically a for loop that builds an array of strings and
  // then glues them together. Every course becomes one .card <div>.
  const cards = courses
    .map((c) => {
      return `
      <div class="card">
        <h3>${escapeHtml(c.code)}: ${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.description)}</p>
        <p>Capacity: ${c.capacity}</p>
        <a href="${base}/${c.id}/edit">Edit Course</a>
      </div>`
    })
    .join('')

  return layout({
    base,
    pageTitle: 'Course Management',
    body: `
      <h1>Module 2: Course Management</h1>
      <p class="actions">
        <a class="btn" href="${base}/create">Create New Course</a>
        <a class="btn" href="${base}/catalog">View Catalog</a>
      </p>
      <h2>All Courses</h2>
      ${cards}
    `,
  })
}

// Catalog: read-only list. No edit links, no buttons. Just the courses.
export function catalogPage(base: string, courses: Course[]): string {
  const items = courses
    .map((c) => {
      return `<li><strong>${escapeHtml(c.code)}</strong> - ${escapeHtml(c.title)}</li>`
    })
    .join('')

  return layout({
    base,
    pageTitle: 'Catalog',
    body: `
      <h1>Course Catalog</h1>
      <ul>${items}</ul>
      <p><a href="${base}">Back to Dashboard</a></p>
    `,
  })
}

// Create form. Empty inputs, submits to POST /create.
export function createPage(base: string): string {
  return layout({
    base,
    pageTitle: 'Create Course',
    body: `
      <h1>Create a Course</h1>
      <form method="POST" action="${base}/create">
        <label>Course Code<br /><input type="text" name="code" required /></label>
        <label>Course Title<br /><input type="text" name="title" required /></label>
        <label>Description<br /><textarea name="description" required></textarea></label>
        <label>Capacity<br /><input type="number" name="capacity" value="30" min="1" required /></label>
        <button type="submit">Save Course</button>
      </form>
      <p><a href="${base}">Back</a></p>
    `,
  })
}

// Edit form. Same as create but the inputs are pre-filled with the course that
// the user clicked. I use escapeHtml inside value="..." otherwise a quote in
// the title would break the HTML attribute.
export function editPage(base: string, course: Course): string {
  return layout({
    base,
    pageTitle: `Edit Course: ${course.code}`,
    body: `
      <h1>Edit Course: ${escapeHtml(course.code)}</h1>
      <form method="POST" action="${base}/${course.id}/edit">
        <label>Course Code<br /><input type="text" name="code" value="${escapeHtml(course.code)}" required /></label>
        <label>Course Title<br /><input type="text" name="title" value="${escapeHtml(course.title)}" required /></label>
        <label>Description<br /><textarea name="description" required>${escapeHtml(course.description)}</textarea></label>
        <label>Capacity<br /><input type="number" name="capacity" value="${course.capacity}" min="1" required /></label>
        <button type="submit">Update Course</button>
      </form>
      <p><a href="${base}">Cancel</a></p>
    `,
  })
}

// Reusable "it worked" page. Pass the heading and it shows that plus a link back.
export function successPage(base: string, heading: string): string {
  return layout({
    base,
    pageTitle: heading,
    body: `
      <h1>${escapeHtml(heading)}</h1>
      <p><a href="${base}">Back to Dashboard</a></p>
    `,
  })
}

// When the user asks for a course that doesn't exist (e.g. /999/edit).
// I return proper HTML instead of a plain text message so the page still looks
// like part of the site.
export function notFoundPage(base: string, message = 'Course not found'): string {
  return layout({
    base,
    pageTitle: 'Not Found',
    body: `
      <h1>${escapeHtml(message)}</h1>
      <p><a href="${base}">Back to Dashboard</a></p>
    `,
  })
}