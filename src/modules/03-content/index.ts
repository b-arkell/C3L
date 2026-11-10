// MODULE 3: Content Management
//
// Scope from the project brief:
//   - Create modules/units
//   - Upload learning materials
//   - Organize content by week or topic
//   - Content publishing
//   - Content visibility controls
//
// HOW TO ADD A PAGE TO THE ROUTER (basic demo):
//   1. Find the router at the bottom of this file.
//   2. Copy the  .get('/hello', ...)  line.
//   3. Change the address ('/hello') and the HTML it returns.
//   4. Save. Your new page is at  http://localhost:3000/03-content/<your-address>
import { Elysia } from 'elysia'
import { defineModule, moduleBase } from '../../core/defineModule'
import { moduleCreateRoutes } from './module.create.routes'
import { moduleListRoutes } from './module.list.routes'

const base = moduleBase(import.meta.dir)

export default defineModule({
  name: 'Module 3: Content Management',
  description: 'Units, learning materials, publishing',

  router: new Elysia()
    .use(moduleCreateRoutes)
    .use(moduleListRoutes)
    // Front page of this module. The button on the home page opens it.
    .get(
      '/',
      () => `
        <h1>Module 3: Content Management</h1>
        <p>It works! Replace this page with your own.</p>
        <p><a href="${base}/hello">Demo page</a></p>
        <p><a href="/">Back to the home page</a></p>
      `,
    )
    // DEMO: this one line is all it takes to add a page.
    .get('/hello', () => `<h1>Hello from Module 3</h1><a href="${base}">Back</a>`),
})
