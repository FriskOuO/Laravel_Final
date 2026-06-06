import { apiClient } from './httpClient.js';

export async function uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await apiClient.post('/photos', formData);

    return response.data.data;
}

export const photoApi = {
    uploadPhoto,
};
