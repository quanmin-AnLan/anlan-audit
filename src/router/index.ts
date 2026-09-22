import QueuesView from '@/views/QueuesView.vue'
import ChannelTasksView from '@/views/ChannelTasksView.vue'
import TaskDetailView from '@/views/TaskDetailView.vue'
import ChannelsView from '@/views/ChannelsView.vue'
import RulesView from '@/views/RulesView.vue'
import CommentsView from '@/views/CommentsView.vue'
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/audit', redirect: '/audit/queues' },
  { path: '/audit/comments', component: CommentsView },
  { path: '/audit/queues', component: QueuesView },
  { path: '/audit/queues/:channelId', component: ChannelTasksView },
  { path: '/audit/tasks/:taskId', component: TaskDetailView },
  { path: '/audit/channels', component: ChannelsView },
  { path: '/audit/channels/:channelId/rules', component: RulesView },
]
