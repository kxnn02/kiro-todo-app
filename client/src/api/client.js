const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

// Categories
export const categoriesApi = {
  getAll: () => request('/categories'),
  getById: (id) => request(`/categories/${id}`),
  create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// Tags
export const tagsApi = {
  getAll: () => request('/tags'),
  getById: (id) => request(`/tags/${id}`),
  create: (data) => request('/tags', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/tags/${id}`, { method: 'DELETE' }),
};

// Tasks
export const tasksApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return request(`/tasks${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => request(`/tasks/${id}`),
  create: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleStatus: (id) => request(`/tasks/${id}/status`, { method: 'PATCH' }),
  delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  batchAction: (action, taskIds, extra = {}) =>
    request('/tasks/batch', { method: 'POST', body: JSON.stringify({ action, task_ids: taskIds, ...extra }) }),
};

// Subtasks
export const subtasksApi = {
  getForTask: (taskId) => request(`/tasks/${taskId}/subtasks`),
  create: (taskId, data) => request(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify(data) }),
  toggle: (subtaskId, currentCompleted) => request(`/subtasks/${subtaskId}`, { method: 'PATCH', body: JSON.stringify({ completed: !currentCompleted }) }),
  update: (subtaskId, data) => request(`/subtasks/${subtaskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (subtaskId) => request(`/subtasks/${subtaskId}`, { method: 'DELETE' }),
};
