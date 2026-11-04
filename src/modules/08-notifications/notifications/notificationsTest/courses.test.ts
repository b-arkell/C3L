import { describe, expect, test } from 'bun:test'
import { courseExists } from '../courses'

describe('courseExists (Stub until we gain access to module 2s API documents)', () => {
    test('accepts a non-empty course ID', () => {
        expect(courseExists('course-123')).toBe(true)
    })

    test('rejects an empty course ID', () => {
        expect(courseExists('')).toBe(false)
    })
})