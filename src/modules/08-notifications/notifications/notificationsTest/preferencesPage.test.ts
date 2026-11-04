import { describe, expect, test } from 'bun:test'
import { EVENT_TYPES } from '../eventTypes'
import { preferencesPage } from '../preferencesPage'

describe('preferencesPage', () => {
    const html = preferencesPage('user-1')

    test('has a column for every event type', () => {
        for (const type of EVENT_TYPES) {
            expect(html).toContain(`<th>${type}</th>`)
        }
    })

    test('links back to the module front page and the site home', () => {
        expect(html).toContain('href="/08-notifications"')
        expect(html).toContain('href="/"')
    })

    test('loads state from FR-08 and saves through FR-06 / FR-07', () => {
        expect(html).toContain("'/api/users/me/notificationPreferences'")
        expect(html).toContain("'subscribe'")
        expect(html).toContain("'unsubscribe'")
    })

    test('escapes the user ID', () => {
        const page = preferencesPage('<script>alert(1)</script>')

        expect(page).not.toContain('<script>alert(1)</script>')
        expect(page).toContain('&lt;script&gt;')
    })
})