import { apiClient } from './httpClient.js';

export async function list() {
    const response = await apiClient.get('/diaries');
    return response.data.data;
}

export async function create(payload) {
    let formData;
    if (payload instanceof FormData) {
        formData = payload;
    } else {
        formData = new FormData();
        Object.entries(payload || {}).forEach(([k, v]) => {
            if (v !== undefined && v !== null) formData.append(k, v);
        });
    }

    const response = await apiClient.post('/diaries', formData);

    return response.data.data;
}

export async function update(id, payload) {
    let formData;
    if (payload instanceof FormData) {
        formData = payload;
    } else {
        formData = new FormData();
        Object.entries(payload || {}).forEach(([k, v]) => {
            if (v !== undefined && v !== null) formData.append(k, v);
        });
    }
    // Use POST with X-HTTP-Method-Override so PHP properly parses multipart form data
    const response = await apiClient.post(`/diaries/${id}`, formData, {
        headers: {
            'X-HTTP-Method-Override': 'PUT',
        },
    });

    return response.data.data;
}

export async function remove(id) {
    const response = await apiClient.delete(`/diaries/${id}`);
    return response.data.data;
}

export const diaryApi = {
    list,
    create,
    update,
    remove,
};
