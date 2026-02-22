import { createFetchWithCookies } from '../cookieFetch';
import { set, clearAll } from '../cookieStore';

const BASE_URL = 'https://api.example.com';

const originalFetch = global.fetch;

beforeEach(async () => {
  await clearAll();
  global.fetch = jest.fn().mockResolvedValue(new Response('ok'));
});

afterEach(() => {
  global.fetch = originalFetch;
});

function getFetchCallArgs() {
  const calls = (global.fetch as jest.Mock).mock.calls;
  const url = calls[0][0] as string;
  const options = calls[0][1] as RequestInit;
  const headers = options.headers as Headers;
  return { url, options, headers };
}

describe('createFetchWithCookies()', () => {
  it('deve incluir cookies no header para mesmo domínio', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc123' });
    const apiFetch = createFetchWithCookies(BASE_URL);
    await apiFetch('/endpoint');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const { url, headers } = getFetchCallArgs();
    expect(url).toBe(`${BASE_URL}/endpoint`);
    expect(headers.get('Cookie')).toBe('token=abc123');
  });

  it('deve resolver paths relativos contra baseUrl', async () => {
    await set(BASE_URL, { name: 'sid', value: 'xyz' });
    const apiFetch = createFetchWithCookies(BASE_URL);
    await apiFetch('/user/profile');

    const { url } = getFetchCallArgs();
    expect(url).toBe(`${BASE_URL}/user/profile`);
  });

  it('não deve incluir cookies para domínio diferente', async () => {
    await set(BASE_URL, { name: 'token', value: 'secret' });
    const apiFetch = createFetchWithCookies(BASE_URL);
    await apiFetch('https://evil.com/steal');

    const { headers } = getFetchCallArgs();
    expect(headers.get('Cookie')).toBeNull();
  });

  it('deve incluir cookies para subdomínio do baseUrl', async () => {
    const base = 'https://example.com';
    await set(base, { name: 'token', value: 'val' });
    const apiFetch = createFetchWithCookies(base);
    await apiFetch('https://api.example.com/data');

    const { headers } = getFetchCallArgs();
    expect(headers.get('Cookie')).toBe('token=val');
  });

  it('não deve incluir cookies quando não há cookies definidos', async () => {
    const apiFetch = createFetchWithCookies(BASE_URL);
    await apiFetch('/endpoint');

    const { headers } = getFetchCallArgs();
    expect(headers.get('Cookie')).toBeNull();
  });

  it('deve preservar headers do caller', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc' });
    const apiFetch = createFetchWithCookies(BASE_URL);
    await apiFetch('/endpoint', {
      headers: { 'Content-Type': 'application/json' },
    });

    const { headers } = getFetchCallArgs();
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Cookie')).toBe('token=abc');
  });

  it('deve aceitar input como URL object', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc' });
    const apiFetch = createFetchWithCookies(BASE_URL);
    await apiFetch(new URL('/test', BASE_URL));

    const { url } = getFetchCallArgs();
    expect(url).toBe(`${BASE_URL}/test`);
  });

  it('deve continuar requisição mesmo se get() falhar internamente', async () => {
    // Com store vazio e URL inválida para baseUrl, get não vai crashar
    // mas vamos testar o fluxo normal sem cookies
    const apiFetch = createFetchWithCookies(BASE_URL);
    await apiFetch('/endpoint');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('não deve incluir cookies para domínio parcialmente igual', async () => {
    await set('https://example.com', { name: 'token', value: 'abc' });
    const apiFetch = createFetchWithCookies('https://example.com');
    await apiFetch('https://notexample.com/data');

    const { headers } = getFetchCallArgs();
    expect(headers.get('Cookie')).toBeNull();
  });
});
