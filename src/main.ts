import { defineMicroApp } from '@shared/child/define-micro-app'

defineMicroApp({
  name: 'anlan-audit',
  app: () => import('./App.vue'),
  routes: () => import('./router'),
})
