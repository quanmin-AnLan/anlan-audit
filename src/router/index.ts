import HubView from '@/views/HubView.vue'
import ReviewWorkspaceView from '@/views/ReviewWorkspaceView.vue'
import SearchView from '@/views/SearchView.vue'
import ChannelsView from '@/views/ChannelsView.vue'
import RulesView from '@/views/RulesView.vue'
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/audit', redirect: '/audit/article' },
  { path: '/audit/article', component: HubView, meta: { businessLine: 'article' } },
  { path: '/audit/comment', component: HubView, meta: { businessLine: 'comment' } },
  { path: '/audit/workspace/:channelId/:taskId', component: ReviewWorkspaceView },
  { path: '/audit/search', component: SearchView },
  { path: '/audit/channels', component: ChannelsView },
  { path: '/audit/channels/:channelId/rules', component: RulesView },
  { path: '/audit/hub/:domain', redirect: (to) => `/audit/${to.params.domain}` },
  { path: '/audit/queues', redirect: '/audit/article' },
  { path: '/audit/comments', redirect: '/audit/comment' },
  { path: '/audit/queues/:channelId', redirect: '/audit/article' },
  { path: '/audit/tasks/:taskId', redirect: '/audit/article' },
]
