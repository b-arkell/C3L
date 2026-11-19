
// TEMP: Course IDs belong to Module 2 (Course Management), not us (SYS-08).
// TODO: replace with a call to Module 2's API
export function courseExists(courseId: string): boolean {
    return courseId.length > 0
}

// TEMP: Courses the user is enrolled in.
// TODO: replace with a call to Module 2's API
export function enrolledCourses(_userId: string): string[] {
    return ['course-101', 'course-202', 'course-303']
}

export function courseMembers(_courseId: string): string[]{
    return ['user_test', 'user_2', "user_3"]
}