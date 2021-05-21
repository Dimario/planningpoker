import { createRouter, createWebHistory } from "vue-router";

import Mainpage from "@/pages/Mainpage.vue";
import Room from "@/pages/Room.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "mainpage",
      component: Mainpage,
    },
    {
      path: "/r/:key",
      name: "room",
      component: Room,
    },
  ],
});
