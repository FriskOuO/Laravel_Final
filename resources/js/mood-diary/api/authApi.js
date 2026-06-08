import { apiClient } from './httpClient.js';

export async function register(payload) {
    const response = await apiClient.post('/auth/register', payload);
    return response.data.data;
}

export async function login(payload) {
    const response = await apiClient.post('/auth/login', payload);
    return response.data.data;
}

export async function getUser() {
    const response = await apiClient.get('/user');
    return response.data;
}

export async function guestLogin() {
    const response = await apiClient.post('/auth/guest-login');
    return response.data.data;
}

export async function listUsers() {
    const response = await apiClient.get('/users');
    return response.data.data;
}

export async function deleteUser(id) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data.data;
}

export const authApi = {
    register,
    login,
    getUser,
    guestLogin,
    listUsers,
    deleteUser,
};
