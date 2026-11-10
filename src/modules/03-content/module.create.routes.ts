import { Elysia } from 'elysia'
import type { CreateLearningModuleInput } from './module.model'
import { createLearningModule } from './module.service'
import { validateCreateLearningModule } from './module.validation'

// Standalone Sprint-1 prototype; integration is coordinated separately.
export const moduleCreateRoutes = new Elysia().post(
  '/api/courses/:courseId/modules',
  async ({ params, request, set }) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      set.status = 400
      return { error: 'Request body must contain valid JSON' }
    }

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      set.status = 400
      return { error: 'Request body must be a JSON object' }
    }

    // Runtime field checks belong to Megha's validator; the URL owns courseId.
    const input = { ...body, courseId: params.courseId } as CreateLearningModuleInput
    const validation = validateCreateLearningModule(input)
    if (!validation.valid) {
      set.status = 400
      return { error: validation.errors.join(', ') }
    }

    const module = createLearningModule(input)
    set.status = 201
    return { module }
  },
  // Read JSON here so missing/malformed bodies receive our JSON 400 response.
  { parse: 'none' },
)
