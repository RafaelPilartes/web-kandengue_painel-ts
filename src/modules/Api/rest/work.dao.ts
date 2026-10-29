import type {
  WorkProjectStatus,
  WorkTaskPriority,
  WorkTaskStatus
} from '@rafaelpilartes/kandengue-shared-v4/types'
import ApiDAO from './Api.dao'

/** Dates are ISO strings: the API serialises Firestore timestamps. */
export type WorkTask = {
  id: string
  title: string
  description: string
  department_id: string
  project_id: string | null
  assignee_id: string | null
  priority: WorkTaskPriority
  status: WorkTaskStatus
  due_date: string | null
  position: number
  completed_at: string | null
  archived: boolean
  created_by: string
  created_at: string | null
  updated_at: string | null
}

export type WorkTaskInput = {
  title: string
  description?: string
  department_id: string
  project_id?: string | null
  assignee_id?: string | null
  priority?: WorkTaskPriority
  due_date?: string | null
}

export type WorkTaskFilters = Partial<{
  department_id: string
  project_id: string
  assignee_id: string
  status: WorkTaskStatus
  due_from: string
  due_to: string
}>

export type WorkComment = {
  id: string
  task_id: string
  author_id: string
  body: string
  created_at: string | null
}

export type WorkProject = {
  id: string
  name: string
  description: string
  department_id: string
  owner_id: string
  due_date: string | null
  status: WorkProjectStatus
  progress: number
  task_count: number
  created_at: string | null
}

export type WorkProjectInput = {
  name: string
  description?: string
  department_id: string
  owner_id: string
  due_date?: string | null
  status?: WorkProjectStatus
}

export type WorkReport = {
  by_department: {
    department_id: string
    name: string
    todo: number
    in_progress: number
    review: number
    done: number
    overdue: number
  }[]
  by_assignee: {
    admin_id: string
    name: string
    open: number
    overdue: number
  }[]
}

export type WorkNotification = {
  id: string
  kind:
    | 'task_assigned'
    | 'task_status_changed'
    | 'task_commented'
    | 'task_due_soon'
  task_id: string
  task_title: string
  actor_id: string
  created_at: string | null
}

const BASE = '/api/v1/admin/work'
const id = (v: string) => encodeURIComponent(v)
const query = (filters: Record<string, string | undefined>) => {
  const params = new URLSearchParams(
    Object.entries(filters).filter((e): e is [string, string] => !!e[1])
  ).toString()
  return params ? `?${params}` : ''
}

export const workDAO = {
  tasks: (filters: WorkTaskFilters = {}) =>
    ApiDAO.get<WorkTask[]>(`${BASE}/tasks${query(filters)}`),
  task: (taskId: string) => ApiDAO.get<WorkTask>(`${BASE}/tasks/${id(taskId)}`),
  createTask: (body: WorkTaskInput) =>
    ApiDAO.post<WorkTask>(`${BASE}/tasks`, body),
  updateTask: (taskId: string, body: Partial<WorkTaskInput>) =>
    ApiDAO.patch<WorkTask>(`${BASE}/tasks/${id(taskId)}`, body),
  archiveTask: (taskId: string) =>
    ApiDAO.post<null>(`${BASE}/tasks/${id(taskId)}/archive`, {}),
  /** `before_id` null puts the task at the end of the column. */
  moveTask: (
    taskId: string,
    body: { status: WorkTaskStatus; before_id: string | null }
  ) => ApiDAO.post<WorkTask>(`${BASE}/tasks/${id(taskId)}/move`, body),
  comments: (taskId: string) =>
    ApiDAO.get<WorkComment[]>(`${BASE}/tasks/${id(taskId)}/comments`),
  addComment: (taskId: string, body: string) =>
    ApiDAO.post<{ id: string }>(`${BASE}/tasks/${id(taskId)}/comments`, {
      body
    }),
  projects: () => ApiDAO.get<WorkProject[]>(`${BASE}/projects`),
  createProject: (body: WorkProjectInput) =>
    ApiDAO.post<{ id: string }>(`${BASE}/projects`, body),
  updateProject: (projectId: string, body: Partial<WorkProjectInput>) =>
    ApiDAO.patch<null>(`${BASE}/projects/${id(projectId)}`, body),
  report: (departmentId?: string) =>
    ApiDAO.get<WorkReport>(
      `${BASE}/reports/summary${query({ department_id: departmentId })}`
    ),
  notifications: () => ApiDAO.get<WorkNotification[]>(`${BASE}/notifications`),
  markRead: (ids: string[] = []) =>
    ApiDAO.post<null>(`${BASE}/notifications/read`, { ids })
}
