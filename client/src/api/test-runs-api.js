const BASE_URL = '/api/test-runs';

async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function fetchRuns() {
  return request(BASE_URL);
}

export function fetchRun(id) {
  return request(`${BASE_URL}/${id}`);
}

export function createRun(suiteId) {
  return request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suite_id: suiteId }),
  });
}

export function updateRunResult(runId, resultId, payload) {
  return request(`${BASE_URL}/${runId}/results/${resultId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
