import HubView from '@/views/HubView.vue'
import ReviewWorkspaceView from '@/views/ReviewWorkspaceView.vue'
import SearchView from '@/views/SearchView.vue'
import ChannelsView from '@/views/ChannelsView.vue'
import RulesView from '@/views/RulesView.vue'
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/audit', redirect: '/audit/hub/article' },
  { path: '/audit/hub/:domain', component: HubView },
  { path: '/audit/workspace/:channelId/:taskId', component: ReviewWorkspaceView },
  { path: '/audit/search', component: SearchView },
  { path: '/audit/channels', component: ChannelsView },
  { path: '/audit/channels/:channelId/rules', component: RulesView },
  // 旧路由兼容
  { path: '/audit/queues', redirect: '/audit/hub/article' },
  { path: '/audit/comments', redirect: '/audit/hub/comment' },
  { path: '/audit/queues/:channelId', redirect: '/audit/hub/article' },
  { path: '/audit/tasks/:taskId', redirect: '/audit/hub/article' },
]
