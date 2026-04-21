const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getTodos: () => request('/todos'),

  createTodo: (title) =>
    request('/todos', { method: 'POST', body: JSON.stringify({ title }) }),

  updateTodo: (id, fields) =>
    request(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }),

  deleteTodo: (id) =>
    request(`/todos/${id}`, { method: 'DELETE' }),

  createOrder: () => request('/payment/create-order', { method: 'POST' }),

  verifyPayment: (payload) =>
    request('/payment/verify', { method: 'POST', body: JSON.stringify(payload) }),
};