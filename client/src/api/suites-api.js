const BASE_URL = '/api/suites';

async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json();
  if (!body.success) {
    throw new Error(body.error || 'Request failed');
  }
  return body.data;
}

export function fetchSuites(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  return request(`${BASE_URL}?${query}`);
}

export function fetchSuite(id) {
  return request(`${BASE_URL}/${id}`);
}

export function createSuite(payload) {
  return request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateSuite(id, payload) {
  return request(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function deleteSuite(id) {
  return request(`${BASE_URL}/${id}`, { method: 'DELETE' });
}

export function addSuiteCase(suiteId, testCaseId) {
  return request(`${BASE_URL}/${suiteId}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test_case_id: testCaseId }),
  });
}

export function removeSuiteCase(suiteId, testCaseId) {
  return request(`${BASE_URL}/${suiteId}/cases/${testCaseId}`, { method: 'DELETE' });
}

export function reorderSuiteCases(suiteId, testCaseIds) {
  return request(`${BASE_URL}/${suiteId}/cases/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test_case_ids: testCaseIds }),
  });
}
