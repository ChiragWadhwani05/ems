import axios from 'axios';

const getBaseURL = () => {
  // For development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/api';
  }

  // For production (Vercel)
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
