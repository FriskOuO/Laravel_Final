import './bootstrap';
import { createDiaryApp } from './mood-diary/ui/createDiaryApp.js';
import { authStore } from './mood-diary/stores/authStore.js';

authStore.getState();

const appRoot = document.querySelector('[data-mood-diary-app]');

if (appRoot) {
	createDiaryApp(appRoot);
}
