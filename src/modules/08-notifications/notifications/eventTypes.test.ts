import { expect, test } from 'bun:test'
import {isEventType} from './eventTypes'





  test('Returns correct event type', () =>{
    expect(isEventType('grade')).toBe(true);
  })


  test('Returns incorrect event type', () => {
    expect(isEventType('banana')).toBe(false);
  })

