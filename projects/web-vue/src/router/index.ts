import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/game/:chain/:id",
      name: "game-detail",
      component: () => import("../views/GameDetailView.vue"),
    },
    {
      path: "/game/:chain/:id/play",
      name: "game-play",
      component: () => import("../views/GamePlayView.vue"),
    },
    {
      path: "/game/:chain/:id/overview",
      name: "game-play-overview",
      component: () => import("../views/GamePlayView.vue"),
    },
    {
      path: "/proof/:chain/:txId",
      name: "proof",
      component: () => import("../views/TxProof.vue"),
    },
    {
      path: "/create-game",
      name: "create-game",
      component: () => import("../views/CreateGameView.vue"),
    },
    {
      path: "/proovable-fair-onchain-game",
      name: "proovable-fair-onchain-game",
      component: () => import("../views/Rules.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "404",
      component: () => import("../views/Error404.vue"),
    },
  ],
});

export default router;
