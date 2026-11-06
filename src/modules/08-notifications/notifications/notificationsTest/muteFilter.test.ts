
import { describe, expect, test } from 'bun:test'
import { removeMutedUsers } from '../muteFilter'
import { muteCategories } from '../unsubscribe'

describe('removeMutedUsers', () => {
    test('keeps everyone when nobody muted', () => {
        expect(removeMutedUsers(['user_a', 'user_b'], 'course-m1', 'quiz')).toEqual(['user_a', 'user_b'])
    })

    test('removes a user who muted that category in that course', () => {
        muteCategories('user_a', {course_id: 'course-m2', event_type: ['quiz']})
        expect(removeMutedUsers(['user_a', 'user_b'], 'course-m2', 'quiz')).toEqual(['user_b'])
    })

    test('a mute only applies to its own category', () => {
        muteCategories('user_a', { course_id: 'course-m3', event_type: ['quiz'] })
        expect(removeMutedUsers(['user_a'], 'course-m3', 'grade')).toEqual(['user_a'])
    })

    test('a mute only applies to its own course', () => {
        muteCategories('user_a', { course_id: 'course-m4', event_type: ['quiz'] })
        expect(removeMutedUsers(['user_a'], 'course-m5', 'quiz')).toEqual(['user_a'])
    })
})