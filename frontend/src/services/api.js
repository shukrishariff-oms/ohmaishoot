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

export const trackAlbumClick = async (albumId, source = 'direct') => {
  // Fire-and-forget; never block the redirect on this.
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ source })], { type: 'application/json' });
      navigator.sendBeacon(`${API_URL}/albums/${albumId}/click`, blob);
      return;
    }
    await api.post(`/albums/${albumId}/click`, { source });
  } catch (_) { /* swallow */ }
};

export const trackPageView = async (path = '/') => {
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ path })], { type: 'application/json' });
      navigator.sendBeacon(`${API_URL}/track/view`, blob);
      return;
    }
    await api.post('/track/view', { path });
  } catch (_) { /* swallow */ }
};

export const getStatsOverview = async () => {
  const response = await api.get('/admin/stats/overview');
  return response.data;
};

export const getStatsAlbums = async (days = 30, limit = 20) => {
  const response = await api.get('/admin/stats/albums', { params: { days, limit } });
  return response.data;
};

export const getStatsSources = async (days = 30) => {
  const response = await api.get('/admin/stats/sources', { params: { days } });
  return response.data;
};

export const getStatsDevices = async (days = 30) => {
  const response = await api.get('/admin/stats/devices', { params: { days } });
  return response.data;
};

export const getStatsHourly = async (days = 30) => {
  const response = await api.get('/admin/stats/hourly', { params: { days } });
  return response.data;
};

export const getEventBySlug = async (slug) => {
  const response = await api.get(`/events/${slug}`);
  return response.data;
};

export const submitLead = async (payload) => {
  const response = await api.post('/leads', payload);
  return response.data;
};

export const getAdminLeads = async (params = {}) => {
  const response = await api.get('/admin/leads', { params });
  return response.data;
};

export const toggleLeadContacted = async (id) => {
  const response = await api.patch(`/admin/leads/${id}/contacted`);
  return response.data;
};

export const deleteLead = async (id) => {
  await api.delete(`/admin/leads/${id}`);
};

export const backfillSlugs = async () => {
  const response = await api.post('/admin/albums/backfill-slugs');
  return response.data;
};
