import { http } from '@shared/child/request'

export interface AuditChannel {
  id: string
  code: string
  name: string
  description: string | null
  enabled: boolean
  sort: number
}

export interface KeywordRule {
  id: string
  channelId: string
  keyword: string
  matchType: string
  matchScope: string
  caseSensitive: boolean
  enabled: boolean
  priority: number
}

export interface QueueItem {
  channelId: string
  code: string
  name: string
  pendingCount: number
}

export interface AuditHit {
  channelId: string
  channelCode: string
  channelName: string
  keyword: string
  matchScope: string
  snippet: string
}

export interface ReviewTask {
  id: string
  articleId: string
  articleTitle: string
  status: string
  hits: AuditHit[]
  submittedAt: string
  channels: { id: string; code: string; name: string }[]
  previewUrl?: string
  previewExpiresAt?: string
}

export const auditApi = {
  listChannels: () => http.get<AuditChannel[]>('/audit/channels'),
  createChannel: (data: { code: string; name: string; description?: string }) =>
    http.post<AuditChannel>('/audit/channels', data),
  updateChannel: (id: string, data: Partial<AuditChannel>) =>
    http.patch<AuditChannel>(`/audit/channels/${id}`, data),
  deleteChannel: (id: string) => http.delete(`/audit/channels/${id}`),

  listRules: (channelId: string) =>
    http.get<KeywordRule[]>(`/audit/channels/${channelId}/rules`),
  createRule: (channelId: string, data: { keyword: string; matchScope?: string }) =>
    http.post<KeywordRule>(`/audit/channels/${channelId}/rules`, data),
  deleteRule: (ruleId: string) => http.delete(`/audit/rules/${ruleId}`),

  listQueues: () => http.get<QueueItem[]>('/audit/queues'),
  listChannelTasks: (channelId: string) =>
    http.get<ReviewTask[]>(`/audit/queues/${channelId}/tasks`),
  getTask: (taskId: string) => http.get<ReviewTask>(`/audit/tasks/${taskId}`),
  approve: (taskId: string) => http.post(`/audit/tasks/${taskId}/approve`),
  reject: (taskId: string, reason: string) =>
    http.post(`/audit/tasks/${taskId}/reject`, { reason }),
}
