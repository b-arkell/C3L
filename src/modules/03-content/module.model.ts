
export interface LearningModule {
  id: string
  courseId: string
  title: string
  description?: string
  week?: number
  topic?: string
  createdAt: string
}

export interface CreateLearningModuleInput {
  courseId: string
  title: string
  description?: string
  week?: number
  topic?: string
}
