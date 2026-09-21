const BASE_URL = '/api/dashboard';

async function request(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function fetchDashboardMetrics() {
  return request(`${BASE_URL}/metrics`);
}
