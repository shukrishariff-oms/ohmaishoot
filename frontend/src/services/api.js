import axios from 'axios';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getPublishedAlbums = async () => {
  const response = await api.get('/albums');
  return response.data;
};

export const getAdminAlbums = async () => {
  const response = await api.get('/admin/albums');
  return response.data;
};

export const loginAdmin = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await api.post('/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const createAlbum = async (albumData, coverImage) => {
  const formData = new FormData();
  formData.append('event_name', albumData.event_name);
  formData.append('event_date', albumData.event_date);
  formData.append('location', albumData.location);
  formData.append('album_url', albumData.album_url);
  formData.append('is_published', albumData.is_published);
  formData.append('cover_image', coverImage);

  const response = await api.post('/admin/albums', formData);
  return response.data;
};

export const updateAlbum = async (id, albumData, coverImage) => {
  const formData = new FormData();
  formData.append('event_name', albumData.event_name);
  formData.append('event_date', albumData.event_date);
  formData.append('location', albumData.location);
  formData.append('album_url', albumData.album_url);
  formData.append('is_published', albumData.is_published);
  
  if (coverImage) {
    formData.append('cover_image', coverImage);
  }

  const response = await api.put(`/admin/albums/${id}`, formData);
  return response.data;
};

export const togglePublishAlbum = async (id) => {
  const response = await api.patch(`/admin/albums/${id}/publish`);
  return response.data;
};

export const deleteAlbum = async (id) => {
  await api.delete(`/admin/albums/${id}`);
};

export const getCoverUrl = (filename) => {
  return `${API_URL}/covers/${filename}`;
};
