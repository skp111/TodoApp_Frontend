// src/services/userServices.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL
});

const userData = (formData) => {
  return api.post('/user', formData);
};

export default userData;
