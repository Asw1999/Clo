import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MyDriveView from '../views/MyDriveView.vue';
import RecentView from '../views/RecentView.vue';
import SharedWithMeView from '../views/SharedWithMeView.vue';
import StarredView from '../views/StarredView.vue';
import QuotaView from '../views/QuotaView.vue';
import LoginView from '../views/auth/LoginView.vue';
import RegisterView from '../views/auth/RegisterView.vue';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/login',
			name: 'login',
			component: LoginView,
			meta: { public: true },
		},
		{
			path: '/register',
			name: 'register',
			component: RegisterView,
			meta: { public: true },
		},
		{
			path: '/',
			name: 'home', component: HomeView, meta: { keepAlive: true },
		},
		{
			path: '/my-drive',
			name: 'my-drive', component: MyDriveView, meta: { keepAlive: true },
		},
		{
			path: '/shared-with-me',
			name: 'shared-with-me', component: SharedWithMeView, meta: { keepAlive: true },
		},
		{
			path: '/recent',
			name: 'recent', component: RecentView, meta: { keepAlive: true },
		},
		{
			path: '/starred',
			name: 'starred', component: StarredView, meta: { keepAlive: true },
		},
		{
			path: '/quota',
			name: 'quota', component: QuotaView, meta: { keepAlive: true },
		},
	],
});

router.beforeEach(async (to) => {
	const authStore = useAuthStore();
	await authStore.bootstrap();

	if (!authStore.requiresAuth) {
		if (to.meta.public) {
			return { path: '/' };
		}
		return true;
	}

	if (to.meta.public) {
		return authStore.authenticated ? { path: '/' } : true;
	}

	if (!authStore.authenticated) {
		return { path: '/login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } };
	}

	return true;
});

export default router;
