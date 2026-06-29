import axios from 'axios';

const API_BASE_URL = 'http://localhost:7410/api'; // Update with your actual BE URL

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

export const LandingApi = {
    getConfig: async () => {
        const response = await apiClient.get('/public/landing/config');
        return response.data.data;
    }
};

export const ArticleApi = {
    getPublicArticles: async (page = 0, size = 10) => {
        const response = await apiClient.get(`/public/articles?page=${page}&size=${size}`);
        return response.data.data;
    },
    getArticleById: async (id: string) => {
        const response = await apiClient.get(`/public/articles/${id}`);
        return response.data.data;
    }
};

export const ProductApi = {
    getAll: async (page = 0, size = 10, category?: string) => {
        const response = await apiClient.post(`/public/product/filter`, {
            page,
            size,
            category
        });
        return response.data.data;
    },
    getById: async (id: string) => {
        const response = await apiClient.get(`/public/product/${id}`);
        return response.data.data;
    }
};

export default apiClient;
