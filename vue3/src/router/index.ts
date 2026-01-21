import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [

        {
            path: '/',
            component: () => import('@/views/Home.vue')
        },
        {
            path: '/Vitur',
            component: () => import('@/views/Vitur.vue')
        },
        // 1. 401 无权限页
        {
            path: '/401',
            name: 'NoPermission',
            component: () => import('@/views/errors/401.vue'),
            meta: { title: '无权限' }
        },

        // 2. 【必需】定义真正的 404 页面路由
        {
            path: '/404',
            name: 'NotFound',
            component: () => import('@/views/errors/404.vue'), // 假设你文件叫 404.vue
            meta: { title: '页面不存在' }
        },

        // 3. 通配符路由（必须放在最后！）
        {
            path: '/:pathMatch(.*)*',
            redirect: '/404' // 只有上面定义了 /404，这里才能跳转成功
        }
    ]
})


export default router;