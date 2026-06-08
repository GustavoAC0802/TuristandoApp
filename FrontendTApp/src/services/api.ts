import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.API_URL || 'https://turistando-app.vercel.app';

const api = axios.create({
  baseURL: API_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token =
    (await AsyncStorage.getItem('token')) ||
    (await AsyncStorage.getItem('@turistando:token')) ||
    (await AsyncStorage.getItem('authToken')) ||
    (await AsyncStorage.getItem('@auth:token'));

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('BASE URL:', API_URL);
  console.log('URL:', config.url);
  console.log('TOKEN ENVIADO?', token ? 'SIM' : 'NÃO');

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API ERROR:', {
      url: error?.config?.url,
      status: error?.response?.status,
      message: error?.message,
      data: error?.response?.data,
    });

    return Promise.reject(error);
  }
);

export default api;