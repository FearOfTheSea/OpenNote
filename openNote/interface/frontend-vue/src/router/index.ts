import { createRouter, createWebHistory } from "vue-router";
import SignInView from "../views/SignInView.vue";
import SignUpView from "../views/SignUpView.vue";
import HomeView from "../views/HomeView.vue";
import FolderContentsView from "../views/FolderContentsView.vue";
import NoteContentView from "../views/NoteContentView.vue";
import SearchView from "../views/SearchView.vue";
import NotesFilteredByTagsView from "../views/NotesFilteredByTagsView.vue";

const routes = [
  { path: "/", redirect: "/signin" }, // default -> /signin
  { path: "/signin", name: "SignIn", component: SignInView },
  { path: "/signup", name: "SignUp", component: SignUpView },
  { path: "/home", name: "Home", component: HomeView },
  { path: "/notes", name: "NoteFilteredByTag", component: NotesFilteredByTagsView },
  { path: "/search", name: "Search", component: SearchView },
  { path: "/folder/:id", name: "FolderContentsView", component: FolderContentsView },
  { path: "/note/:id", name: "NoteContentView", component: NoteContentView },

  { path: "/:pathMatch(.*)*", redirect: "/signin" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
