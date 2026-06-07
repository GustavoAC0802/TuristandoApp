import axios from 'axios';
import Constants from 'expo-constants';

const API_URL =
  process.env.API_URL ||
  Constants.expoConfig?.extra?.API_URL ||
  'https://turistando-app.vercel.app';

const api = axios.create({
  baseURL: API_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  console.log('BASE URL:', API_URL);
  console.log('URL:', config.url);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.message;

    console.log('API ERROR:', {
      url: error?.config?.url,
      status,
      message,
      data: error?.response?.data,
    });

    return Promise.reject(error);
  }
);

export default api;