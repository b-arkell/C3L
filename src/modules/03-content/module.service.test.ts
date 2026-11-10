
/**
 * Module 3: Content Management
 * File: module.service.test.ts
 *
 * Purpose:
 * Test learning-module creation and validation.
 */

import { describe, expect, test } from 'bun:test'
import { createLearningModule } from './module.service'

describe('Learning module creation', () => {
  // Test 1: Valid information should create a module.
  test('creates a module with valid input', () => {
    const module = createLearningModule({
      courseId: 'COURSE-101',
      title: 'Introduction to TypeScript',
      description: 'Basic TypeScript concepts',
      week: 1,
      topic: 'TypeScript Basics',
    })

    // Check that the new module contains the expected data.
    expect(module.id).toBeTruthy()
    expect(module.courseId).toBe('COURSE-101')
    expect(module.title).toBe('Introduction to TypeScript')
    expect(module.week).toBe(1)
    expect(module.createdAt).toBeTruthy()
  })

  // Test 2: An empty title should be rejected.
  test('rejects an empty module title', () => {
    expect(() =>
      createLearningModule({
        courseId: 'COURSE-101',
        title: '',
      }),
    ).toThrow('Module title is required')
  })

  // Test 3: An empty course ID should be rejected.
  test('rejects an empty course ID', () => {
    expect(() =>
      createLearningModule({
        courseId: '',
        title: 'Module 1',
      }),
    ).toThrow('Course ID is required')
  })

  // Test 4: Week numbers must be positive integers.
  test('rejects an invalid week number', () => {
    expect(() =>
      createLearningModule({
        courseId: 'COURSE-101',
        title: 'Module 1',
        week: -1,
      }),
    ).toThrow('Week must be a positive integer')
  })
})
