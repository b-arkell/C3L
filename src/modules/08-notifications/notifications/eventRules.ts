import type { EventType } from "./eventTypes";

// parts of an event that rules need to look at 
export interface IncomingEvent {
    event_type: EventType
    course_id: string
    user_ids?: string[]
}

// returns reason an event is invalid or null if fine
export function checkEventRules(event: IncomingEvent): string | null {
    if (event.event_type === 'grade' && (!event.user_ids || event.user_ids.length === 0)){
        return 'user_ids is required for grade events'
    }
    return null
}