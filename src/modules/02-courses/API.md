# Module 2 — Course Management API

Base path: `/02-courses`

This is the inter-module API for the Course Management module. Other modules use it to look up courses, check enrollment state, and find out which instructor teaches a course.

**It is read-only today.** Write endpoints will be added in a later sprint if other modules need them. Everything currently writeable through Module 2 happens via its own HTML form pages (which are also documented in the Swagger UI linked below), not this JSON API.

## Endpoints

### `GET /api/courses`

Returns every course, active and archived.

Response shape:

```json
{
  "courses": [
    {
      "id": "1",
      "code": "PROG2020",
      "title": "Advanced Software Development Tools",
      "description": "Learning Git, Bun, and web development.",
      "capacity": 30,
      "enrollments": [],
      "instructorId": null,
      "archived": false
    },
    {
      "id": "2",
      "code": "CSCN72030",
      "title": "System Architecture",
      "description": "Designing backend systems and APIs.",
      "capacity": 35,
      "enrollments": ["student-42"],
      "instructorId": "inst-1",
      "archived": false
    }
  ]
}