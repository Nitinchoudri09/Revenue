import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// We setup the interceptors inside the Auth hook or a higher level component 
// so it has access to the logout function.

export default api;
