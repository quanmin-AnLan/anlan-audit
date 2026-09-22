import { http } from '@shared/child/request'

export interface PendingCommentItem {
  id: string
  articleId: string
  articleTitle: string
  authorName: string
  content: string
  parentId: string | null
  createdAt: string
}

export const commentsApi = {
  listPending: () => http.get<PendingCommentItem[]>('/articles/comments/pending'),
  approve: (id: string) => http.post<{ id: string; status: string }>(`/articles/comments/${id}/approve`),
  reject: (id: string, reason?: string) =>
    http.post<{ id: string; status: string }>(`/articles/comments/${id}/reject`, { reason }),
}
