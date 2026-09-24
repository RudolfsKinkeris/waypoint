const BASE_URL = '/api/flaky-tests';

async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function fetchFlakyTests() {
  return request(BASE_URL);
}
