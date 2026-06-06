import axios from 'axios';
import { API_BASE_URL } from '../constants.js';
import { authStore } from '../stores/authStore.js';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = authStore.getToken();

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const response = error?.response;
        const status = response?.status;
        const data = response?.data;

        // 統一錯誤響應格式
        const errorResponse = {
            success: false,
            status: data?.status || 'error',
            message: data?.message || '請求失敗',
            errors: data?.errors || null,
            data: null,
        };

        // 根據狀態碼進行特定處理
        switch (status) {
            case 401:
                // 未授權 - 清除會話並重定向到登入
                authStore.clearSession();
                errorResponse.message = '登入已過期，請重新登入';
                break;

            case 403:
                // 禁止存取
                errorResponse.message = '您沒有權限存取此資源';
                break;

            case 404:
                // 資源未找到
                errorResponse.message = '請求的資源不存在';
                break;

            case 422:
                // 驗證失敗 - 已有詳細錯誤訊息
                errorResponse.message = data?.message || '表單驗證失敗';
                break;

            case 429:
                // 請求過於頻繁
                errorResponse.message = '請求過於頻繁，請稍後再試';
                break;

            case 500:
            case 502:
            case 503:
            case 504:
                // 伺服器錯誤
                errorResponse.message = '伺服器發生錯誤，請稍後再試';
                break;

            default:
                if (!response) {
                    // 網路錯誤或超時
                    if (error.code === 'ECONNABORTED') {
                        errorResponse.message = '請求超時，請檢查網路連接';
                    } else if (!window.navigator.onLine) {
                        errorResponse.message = '無網路連接，請檢查您的網路';
                    } else {
                        errorResponse.message = '網路請求失敗，請稍後再試';
                    }
                    errorResponse.status = 'network_error';
                }
                break;
        }

        // 拒絕時返回統一格式的錯誤
        error.formattedError = errorResponse;
        return Promise.reject(error);
    },
);
