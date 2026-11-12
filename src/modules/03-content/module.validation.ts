
/**
 * Module 3: Content Management
 * File: module.validation.ts
 *
 * Purpose:
 * Validate user input before creating a learning module.
 */

import type { CreateLearningModuleInput } from './module.model'

// Describes the result returned by our validation function.
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Checks whether the information needed to create
 * a learning module is valid.
 *
 * @param input - Information entered for the new module.
 * @returns Whether the input is valid and any error messages.
 */
export function validateCreateLearningModule(
  input: CreateLearningModuleInput,
): ValidationResult {
  // Store all validation errors in this array.
  const errors: string[] = []

  // Every learning module must belong to a course.
  if (typeof input.courseId !== 'string' || !input.courseId.trim()) {
    errors.push('Course ID is required')
  }

  // A learning module must have a non-empty title.
  if (typeof input.title !== 'string' || !input.title.trim()) {
    errors.push('Module title is required')
  }

  // Description is optional, but must be text if provided.
  if (
    input.description !== undefined &&
    typeof input.description !== 'string'
  ) {
    errors.push('Description must be a string')
  }

  // Week is optional, but must be a positive whole number.
  if (
    input.week !== undefined &&
    (!Number.isInteger(input.week) || input.week < 1)
  ) {
    errors.push('Week must be a positive integer')
  }

  // Topic is optional, but must be text if provided.
  if (
    input.topic !== undefined &&
    typeof input.topic !== 'string'
  ) {
    errors.push('Topic must be a string')
  }

  // Validation succeeds only when no errors were found.
  return {
    valid: errors.length === 0,
    errors,
  }
}
