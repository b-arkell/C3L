
/**
 * Module 3: Content Management
 * File: module.service.ts
 *
 * Purpose:
 * Create learning modules after validating their input.
 *
 * Storage:
 * Uses an in-memory array for the Sprint-1 prototype.
 * Data is lost when the server restarts.
 */

import type {
  CreateLearningModuleInput,
  LearningModule,
} from './module.model'

import { validateCreateLearningModule } from './module.validation'

// Temporary storage for learning modules.
const learningModules: LearningModule[] = []

/**
 * Creates a new learning module.
 *
 * @param input - Data provided for the new module.
 * @returns The newly created learning module.
 * @throws Error if validation fails.
 */
export function createLearningModule(
  input: CreateLearningModuleInput,
): LearningModule {
  // Validate input before creating anything.
  const validation = validateCreateLearningModule(input)

  // Reject invalid input with useful error messages.
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  // Build the new learning-module object.
  const newModule: LearningModule = {
    id: crypto.randomUUID(),
    courseId: input.courseId.trim(),
    title: input.title.trim(),
    description: input.description?.trim(),
    week: input.week,
    topic: input.topic?.trim(),
    createdAt: new Date().toISOString(),
  }

  // Save the new module in temporary memory.
  learningModules.push(newModule)

  // Return the created module to the caller.
  return newModule
}

/**
 * Returns learning modules belonging to a course.
 *
 * This helper is provided for integration with
 * Jaydev's module-listing endpoint.
 *
 * @param courseId - Course identifier to filter by.
 * @returns Matching learning modules.
 */
export function getLearningModulesByCourse(
  courseId: string,
): LearningModule[] {
  return learningModules.filter(
    (module) => module.courseId === courseId,
  )
}
