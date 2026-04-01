import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/views/Home.vue"),
      children: [
        {
          path: "",
          redirect: "/Vitur",
        },
        {
          path: "Vitur",
          component: () => import("@/views/Vitur/Vitur.vue"),
        },
        {
          path: "DirectiveDemo",
          component: () => import("@/views/DirectiveDemo.vue"),
        },
        {
          path: "CustomFormTable",
          component: () => import("@/views/CustomFormTable/index.vue"),
        },
      ],
    },
  ],
});

export default router;
