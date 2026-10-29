import type { WorkTaskStatus } from '@rafaelpilartes/kandengue-shared-v4/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  workDAO,
  type WorkProjectInput,
  type WorkTask,
  type WorkTaskFilters,
  type WorkTaskInput
} from '@/modules/Api/rest/work.dao'

const TASKS = ['work-tasks'] as const
const PROJECTS = ['work-projects'] as const
const NOTIFICATIONS = ['work-notifications'] as const

/** Polls: the module reads through the API, not onSnapshot. */
const REFRESH_MS = 30_000

export function useWorkTasks(filters: WorkTaskFilters = {}) {
  const query = useQuery({
    queryKey: [...TASKS, filters],
    queryFn: () => workDAO.tasks(filters),
    refetchInterval: REFRESH_MS
  })
  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError
  }
}

/** Places `task` before `beforeId` (null: at the end) of `status`, renumbering like the server does. */
export function moveLocally(
  tasks: WorkTask[],
  taskId: string,
  status: WorkTaskStatus,
  beforeId: string | null
): WorkTask[] {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return tasks
  const column = tasks
    .filter(
      t =>
        t.id !== taskId &&
        t.status === status &&
        t.department_id === task.department_id
    )
    .sort((a, b) => a.position - b.position)
  const index = beforeId ? column.findIndex(t => t.id === beforeId) : -1
  const at = index === -1 ? column.length : index
  const ordered = [
    ...column.slice(0, at),
    { ...task, status },
    ...column.slice(at)
  ]
  const renumbered = new Map(
    ordered.map((t, i) => [t.id, { ...t, position: i }])
  )
  return tasks.map(t => renumbered.get(t.id) ?? t)
}

export function useTaskMutations() {
  const queryClient = useQueryClient()
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: TASKS })
    queryClient.invalidateQueries({ queryKey: PROJECTS })
  }

  const create = useMutation({
    mutationFn: (input: WorkTaskInput) => workDAO.createTask(input),
    onSuccess: refresh
  })
  const update = useMutation({
    mutationFn: (v: { id: string; values: Partial<WorkTaskInput> }) =>
      workDAO.updateTask(v.id, v.values),
    onSuccess: refresh
  })
  const archive = useMutation({
    mutationFn: (taskId: string) => workDAO.archiveTask(taskId),
    onSuccess: refresh
  })

  /** Optimistic: the card lands at once and goes back if the API refuses. */
  const move = useMutation({
    mutationFn: (v: {
      id: string
      status: WorkTaskStatus
      beforeId: string | null
    }) => workDAO.moveTask(v.id, { status: v.status, before_id: v.beforeId }),
    onMutate: async v => {
      await queryClient.cancelQueries({ queryKey: TASKS })
      const snapshots = queryClient.getQueriesData<WorkTask[]>({
        queryKey: TASKS
      })
      for (const [key, data] of snapshots) {
        if (data)
          queryClient.setQueryData(
            key,
            moveLocally(data, v.id, v.status, v.beforeId)
          )
      }
      return { snapshots }
    },
    onError: (_err, _v, context) => {
      for (const [key, data] of context?.snapshots ?? [])
        queryClient.setQueryData(key, data)
    },
    onSettled: refresh
  })

  return { create, update, archive, move }
}

export function useTaskComments(taskId: string | null) {
  const queryClient = useQueryClient()
  const key = ['work-comments', taskId]
  const query = useQuery({
    queryKey: key,
    queryFn: () => workDAO.comments(taskId as string),
    enabled: !!taskId
  })
  const add = useMutation({
    mutationFn: (body: string) => workDAO.addComment(taskId as string, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  })
  return { comments: query.data ?? [], isLoading: query.isLoading, add }
}

export function useWorkProjects() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: PROJECTS,
    queryFn: workDAO.projects,
    refetchInterval: REFRESH_MS
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: PROJECTS })
  const create = useMutation({
    mutationFn: (input: WorkProjectInput) => workDAO.createProject(input),
    onSuccess: refresh
  })
  const update = useMutation({
    mutationFn: (v: { id: string; values: Partial<WorkProjectInput> }) =>
      workDAO.updateProject(v.id, v.values),
    onSuccess: refresh
  })
  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update
  }
}

export function useWorkReport(
  departmentId: string | undefined,
  enabled: boolean
) {
  const query = useQuery({
    queryKey: ['work-report', departmentId ?? 'all'],
    queryFn: () => workDAO.report(departmentId),
    enabled
  })
  return {
    report: query.data,
    isLoading: query.isLoading,
    isError: query.isError
  }
}

export function useWorkNotifications() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: NOTIFICATIONS,
    queryFn: workDAO.notifications,
    refetchInterval: 60_000
  })
  const markRead = useMutation({
    mutationFn: (ids: string[]) => workDAO.markRead(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS })
  })
  const notifications = query.data ?? []
  return {
    notifications,
    // The API returns only the unread: the bell is an inbox.
    unread: notifications.length,
    markRead
  }
}
