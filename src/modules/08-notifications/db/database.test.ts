import {expect, test } from 'bun:test'
import { EVENT_TYPES } from '../notifications/eventTypes'
import { createDatabase } from './database'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// ensures the tables exist
test('creates the notification tables', () => {
    const db = createDatabase(':memory:')
    const rows = db.query("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
        name: string
    }[]
    const names = rows.map((rows) => rows.name)

    expect(names).toContain('notifications')
    expect(names).toContain('notification_recipients')
    expect(names).toContain('notification_categories')
    expect(names).toContain('notification_preferences')
})

test('categories table matches EVENT_TYPES', () => {
    const db = createDatabase(':memory:')
    const rows = db.query('SELECT category FROM notification_categories').all() as {
        category: string
    }[]
    const categories = rows.map((row) => row.category)

    expect(categories.sort()).toEqual([...EVENT_TYPES].sort())
})

test('opening the same database twice is safe', () => {
    const path = join(tmpdir(), `notif-test-${crypto.randomUUID()}.db`)
  
    try {
      createDatabase(path).close()
      expect(() => createDatabase(path).close()).not.toThrow()
    } finally {
      rmSync(path, { force: true })
    }
  })

  test('rejects a notification with an unknown event type', () => {
    const db = createDatabase(':memory:')
    const insertBadType = () =>
      db.exec(
        "INSERT INTO notifications VALUES ('n1', 'banana', NULL, 'Hi', 'Hello', '2026-10-29T12:00:00Z')",
      )
  
    expect(insertBadType).toThrow()
  })

