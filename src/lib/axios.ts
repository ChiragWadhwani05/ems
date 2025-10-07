import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.URL}/api/` || 'http://localhost:3000/api/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
