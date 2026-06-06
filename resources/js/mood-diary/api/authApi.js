import { apiClient } from './httpClient.js';

export async function register(payload) {
    const response = await apiClient.post('/auth/register', payload);
    return response.data.data;
}

export async function login(payload) {
    const response = await apiClient.post('/auth/login', payload);
    return response.data.data;
}

export async function guestLogin() {
    const response = await apiClient.post('/auth/guest-login');
    return response.data.data;
}

export const authApi = {
    register,
    login,
    guestLogin,
};
