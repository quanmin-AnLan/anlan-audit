import { http } from '@shared/child/request'

export interface AuditChannel {
  id: string
  code: string
  name: string
  description: string | null
  enabled: boolean
  sort: number
  level?: string
  parentId?: string | null
  domain?: string | null
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

export interface HubChannel {
  id: string
  code: string
  name: string
  pendingCount: number
}

export interface HubGroup {
  id: string
  name: string
  channels: HubChannel[]
}

export interface HubData {
  domain: string
  routeName: string
  groups: HubGroup[]
}

export interface AuditHit {
  channelId: string
  channelCode: string
  channelName: string
  keyword: string
  matchScope: string
  snippet: string
}

export interface ReviewActionRecord {
  id: string
  actorId: string
  actorName: string
  actorTitle: string | null
  action: string
  reason: string | null
  createdAt: string
}

export interface ReviewTask {
  id: string
  contentType: string
  articleId: string
  articleTitle: string
  commentId?: string | null
  commentContent?: string | null
  authorId?: string | null
  authorName?: string | null
  authorTitle?: string | null
  status: string
  hits: AuditHit[]
  submittedAt: string
  resolvedAt?: string | null
  channels: { id: string; code: string; name: string }[]
  hubDomain?: string
  channelId?: string
  articleUrl?: string | null
  previewUrl?: string
  previewExpiresAt?: string
  contentAt?: string
  lockExpiresAt?: string | null
  serverTime?: string
  actions?: ReviewActionRecord[]
}

export interface SearchParams {
  articleId?: string
  authorId?: string
  articleTitle?: string
  commentContent?: string
  authorName?: string
  status?: string
  contentType?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export const auditApi = {
  getHub: (domain: string) => http.get<HubData>(`/audit/hub/${domain}`),
  claimTask: (channelId: string) =>
    http.post<{ taskId: string; channelId: string }>(`/audit/channels/${channelId}/claim`),
  getWorkspace: (taskId: string, channelId?: string) =>
    http.get<ReviewTask>(`/audit/tasks/${taskId}/workspace`, {
      params: channelId ? { channelId } : undefined,
    }),
  cancel: (taskId: string) => http.post(`/audit/tasks/${taskId}/cancel`),
  complete: (taskId: string) => http.post(`/audit/tasks/${taskId}/complete`),
  completeNext: (taskId: string, channelId: string) =>
    http.post<{ hasNext: boolean; nextTaskId?: string }>(`/audit/tasks/${taskId}/complete-next`, {
      channelId,
    }),
  reject: (taskId: string, reason: string) =>
    http.post(`/audit/tasks/${taskId}/reject`, { reason }),
  search: (params: SearchParams) =>
    http.get<{ items: ReviewTask[]; total: number; page: number; pageSize: number }>(
      '/audit/search',
      { params },
    ),
  changeVerdict: (taskId: string, action: 'approve' | 'reject', reason?: string) =>
    http.post(`/audit/tasks/${taskId}/verdict`, { action: action.toUpperCase(), reason }),

  listChannels: () => http.get<AuditChannel[]>('/audit/channels'),
  createChannel: (data: { code: string; name: string; description?: string; parentId?: string }) =>
    http.post<AuditChannel>('/audit/channels', data),
  updateChannel: (id: string, data: Partial<AuditChannel>) =>
    http.patch<AuditChannel>(`/audit/channels/${id}`, data),
  deleteChannel: (id: string) => http.delete(`/audit/channels/${id}`),

  listRules: (channelId: string) =>
    http.get<KeywordRule[]>(`/audit/channels/${channelId}/rules`),
  createRule: (channelId: string, data: { keyword: string; matchScope?: string }) =>
    http.post<KeywordRule>(`/audit/channels/${channelId}/rules`, data),
  deleteRule: (ruleId: string) => http.delete(`/audit/rules/${ruleId}`),
}
