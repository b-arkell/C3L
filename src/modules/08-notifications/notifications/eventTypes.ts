export const EVENT_TYPES = [
    "grade",
    "quiz",
    "discussion",
    "assignment",
    "announcement",
    "content",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// function to check if string is an event type
export const isEventType = (value: string): value is EventType => 
    (EVENT_TYPES as readonly string[]).includes(value);