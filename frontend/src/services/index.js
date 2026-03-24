import api from './api';

export const resourceService = {
  getAll: (params) => api.get('/resources', { params }),
  getById: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
};

export const bookingService = {
  getAll: (params) => api.get('/bookings', { params }),
  getMy: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  approve: (id, data) => api.post(`/bookings/${id}/approve`, data),
  reject: (id, data) => api.post(`/bookings/${id}/reject`, data),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
};

export const ticketService = {
  getAll: (params) => api.get('/tickets', { params }),
  getMy: () => api.get('/tickets/my'),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (formData) =>
    api.post('/tickets', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data),
  getComments: (id) => api.get(`/tickets/${id}/comments`),
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, data),
  updateComment: (ticketId, commentId, data) =>
    api.put(`/tickets/${ticketId}/comments/${commentId}`, data),
  deleteComment: (ticketId, commentId) =>
    api.delete(`/tickets/${ticketId}/comments/${commentId}`),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};

export const authService = {
  demoLogin: (data) => api.post('/auth/demo-login', data),
  getMe: () => api.get('/auth/me'),
};

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
};
