import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/pulse/assets',
    },
    {
      path: '/pulse',
      component: () => import('../layouts/MainLayout.vue'),
      redirect: '/pulse/assets',
      children: [
        {
          path: 'summary',
          name: 'pulse-summary',
          component: () => import('../views/PulseSummaryView.vue'),
        },
        {
          path: 'rooms',
          name: 'pulse-rooms',
          component: () => import('../views/PulseRoomsView.vue'),
        },
        {
          path: 'assets',
          name: 'pulse-assets',
          component: () => import('../views/AssetsView.vue'),
        },
        {
          path: 'users-workplaces',
          name: 'pulse-users-workplaces',
          component: () => import('../views/UsersWorkplacesView.vue'),
        },
      ],
    },
  ],
})

export default router
