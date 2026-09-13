/**
 * Minimal fetch mock for component tests. Pages/forms here always call
 * `fetch(url, {method, body})` and read `res.ok` + `res.json()` — this
 * covers exactly that shape without pulling in a full MSW setup, which
 * would be overkill for the request/response pairs these forms make.
 */
type FetchResponse = {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
};

export function mockFetchOnce(response: FetchResponse) {
  const mockFn = (global.fetch as jest.Mock) ?? jest.fn();
  global.fetch = mockFn as unknown as typeof fetch;
  mockFn.mockResolvedValueOnce({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 400),
    json: response.json,
  });
  return mockFn;
}

export function mockFetchSequence(responses: FetchResponse[]) {
  const mockFn = jest.fn();
  global.fetch = mockFn as unknown as typeof fetch;
  for (const response of responses) {
    mockFn.mockResolvedValueOnce({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 400),
      json: response.json,
    });
  }
  return mockFn;
}

export function jsonResponse(body: unknown, ok = true, status?: number): FetchResponse {
  return { ok, status, json: async () => body };
}
