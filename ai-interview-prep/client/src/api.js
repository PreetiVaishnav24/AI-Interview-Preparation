const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  } catch {
    throw new Error('Cannot reach the server. Check that the API is running.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  uploadResume: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return request('/resume', { method: 'POST', form });
  },
  deleteResume: () => request('/resume', { method: 'DELETE' }),
  createInterview: (body) => request('/interviews', { method: 'POST', body }),
  listInterviews: () => request('/interviews'),
  getInterview: (id) => request(`/interviews/${id}`),
  answer: (id, body) => request(`/interviews/${id}/answer`, { method: 'POST', body }),
  complete: (id) => request(`/interviews/${id}/complete`, { method: 'POST' }),
  deleteInterview: (id) => request(`/interviews/${id}`, { method: 'DELETE' }),
  dashboard: () => request('/dashboard'),
};
