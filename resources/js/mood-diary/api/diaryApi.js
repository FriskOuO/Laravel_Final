import { apiClient } from './httpClient.js';

export async function list() {
    const response = await apiClient.get('/diaries');
    return response.data;
}

export async function create(payload) {
    const response = await apiClient.post('/diaries', payload);
    return response.data;
}

export async function update(id, payload) {
    const response = await apiClient.put(`/diaries/${id}`, payload);
    return response.data;
}

export async function remove(id) {
    const response = await apiClient.delete(`/diaries/${id}`);
    return response.data;
}

export const diaryApi = {
    list,
    create,
    update,
    remove,
};
