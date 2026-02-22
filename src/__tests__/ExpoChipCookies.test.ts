import { set, get, clearAll, clear, flush, toCookieString, createFetchWithCookies, migrateToEncrypted, resetEncryption } from '../ExpoChipCookies';

// Em ambiente de teste, o módulo nativo não existe (mock retorna null).
// Todas as funções usam o fallback in-memory.

const BASE_URL = 'https://api.example.com';

beforeEach(async () => {
  await clearAll();
});

// ─── set() ──────────────────────────────────────────────────────────────────

describe('set()', () => {
  it('deve definir um cookie e recuperá-lo via get()', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc123' });
    const cookies = await get(BASE_URL);
    expect(cookies.token).toBeDefined();
    expect(cookies.token.value).toBe('abc123');
  });

  it('deve lançar erro quando name é string vazia', async () => {
    await expect(
      set(BASE_URL, { name: '', value: 'abc' })
    ).rejects.toThrow("Cookie 'name' is required and must be a string");
  });

  it('deve lançar erro quando name é undefined', async () => {
    await expect(
      set(BASE_URL, { name: undefined as unknown as string, value: 'abc' })
    ).rejects.toThrow("Cookie 'name' is required and must be a string");
  });

  it('deve lançar erro quando value não é string', async () => {
    await expect(
      set(BASE_URL, { name: 'test', value: 123 as unknown as string })
    ).rejects.toThrow("Cookie 'value' must be a string");
  });

  it('deve aceitar value como string vazia', async () => {
    await set(BASE_URL, { name: 'empty', value: '' });
    const cookies = await get(BASE_URL);
    expect(cookies.empty).toBeDefined();
    expect(cookies.empty.value).toBe('');
  });

  it('deve sobrescrever cookie com mesmo nome', async () => {
    await set(BASE_URL, { name: 'token', value: 'first' });
    await set(BASE_URL, { name: 'token', value: 'second' });
    const cookies = await get(BASE_URL);
    expect(cookies.token.value).toBe('second');
  });

  it('deve isolar cookies por hostname', async () => {
    await set('https://a.com', { name: 'x', value: '1' });
    await set('https://b.com', { name: 'x', value: '2' });
    const cookiesA = await get('https://a.com');
    const cookiesB = await get('https://b.com');
    expect(cookiesA.x.value).toBe('1');
    expect(cookiesB.x.value).toBe('2');
  });
});

// ─── get() ──────────────────────────────────────────────────────────────────

describe('get()', () => {
  it('deve retornar mapa vazio quando não há cookies', async () => {
    const cookies = await get(BASE_URL);
    expect(cookies).toEqual({});
  });

  it('deve retornar cópia e não referência direta', async () => {
    await set(BASE_URL, { name: 'a', value: '1' });
    const cookies1 = await get(BASE_URL);
    const cookies2 = await get(BASE_URL);
    expect(cookies1).toEqual(cookies2);
    expect(cookies1).not.toBe(cookies2);
    expect(cookies1.a).not.toBe(cookies2.a);
  });
});

// ─── clear() ────────────────────────────────────────────────────────────────

describe('clear()', () => {
  it('deve remover cookies de uma URL específica', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc' });
    await clear(BASE_URL);
    const cookies = await get(BASE_URL);
    expect(cookies).toEqual({});
  });

  it('não deve afetar cookies de outra URL', async () => {
    await set('https://a.com', { name: 'x', value: '1' });
    await set('https://b.com', { name: 'y', value: '2' });
    await clear('https://a.com');
    const cookiesA = await get('https://a.com');
    const cookiesB = await get('https://b.com');
    expect(cookiesA).toEqual({});
    expect(cookiesB.y.value).toBe('2');
  });

  it('deve retornar true mesmo sem cookies para limpar', async () => {
    const result = await clear('https://nenhum.com');
    expect(result).toBe(true);
  });
});

// ─── clearAll() ─────────────────────────────────────────────────────────────

describe('clearAll()', () => {
  it('deve remover cookies de todas as URLs', async () => {
    await set('https://a.com', { name: 'x', value: '1' });
    await set('https://b.com', { name: 'y', value: '2' });
    await clearAll();
    expect(await get('https://a.com')).toEqual({});
    expect(await get('https://b.com')).toEqual({});
  });
});

// ─── flush() ────────────────────────────────────────────────────────────────

describe('flush()', () => {
  it('deve retornar true (no-op no fallback)', () => {
    expect(flush()).toBe(true);
  });
});

// ─── migrateToEncrypted() ───────────────────────────────────────────────────

describe('migrateToEncrypted()', () => {
  it('deve retornar 0 no fallback (no-op)', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc' });
    const count = await migrateToEncrypted(BASE_URL);
    expect(count).toBe(0);
  });
});

// ─── resetEncryption() ──────────────────────────────────────────────────────

describe('resetEncryption()', () => {
  it('deve limpar o store in-memory e retornar true', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc' });
    const result = await resetEncryption();
    expect(result).toBe(true);
    expect(await get(BASE_URL)).toEqual({});
  });
});

// ─── toCookieString() ───────────────────────────────────────────────────────

describe('toCookieString()', () => {
  it('deve converter CookieMap para formato Cookie header', () => {
    const cookies = {
      a: { name: 'a', value: '1' },
      b: { name: 'b', value: '2' },
    };
    const result = toCookieString(cookies);
    expect(result).toBe('a=1; b=2');
  });

  it('deve preservar cookies com value vazia (string vazia)', () => {
    const cookies = {
      empty: { name: 'empty', value: '' },
      filled: { name: 'filled', value: 'ok' },
    };
    const result = toCookieString(cookies);
    expect(result).toContain('empty=');
    expect(result).toContain('filled=ok');
  });

  it('deve remover \\r e \\n do value (proteção contra header injection)', () => {
    const cookies = {
      bad: { name: 'bad', value: 'val\r\nInjected-Header: evil' },
    };
    const result = toCookieString(cookies);
    expect(result).not.toContain('\r');
    expect(result).not.toContain('\n');
    expect(result).toBe('bad=valInjected-Header: evil');
  });

  it('deve filtrar cookies com name null', () => {
    const cookies = {
      good: { name: 'good', value: 'ok' },
      bad: { name: null as unknown as string, value: 'nope' },
    };
    const result = toCookieString(cookies);
    expect(result).toBe('good=ok');
  });

  it('deve filtrar cookies com value null', () => {
    const cookies = {
      good: { name: 'good', value: 'ok' },
      bad: { name: 'bad', value: null as unknown as string },
    };
    const result = toCookieString(cookies);
    expect(result).toBe('good=ok');
  });

  it('deve retornar string vazia para mapa vazio', () => {
    expect(toCookieString({})).toBe('');
  });
});

// ─── createFetchWithCookies() ───────────────────────────────────────────────

describe('createFetchWithCookies()', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
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

  it('deve continuar requisição mesmo se get() falhar', async () => {
    const cookieStore = require('../cookieStore');
    const originalGetFn = cookieStore.get;
    cookieStore.get = jest.fn().mockRejectedValueOnce(new Error('Native crash'));

    const apiFetch = createFetchWithCookies(BASE_URL);
    await apiFetch('/endpoint');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Restaurar
    cookieStore.get = originalGetFn;
  });

  it('deve aceitar input como URL object', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc' });
    const apiFetch = createFetchWithCookies(BASE_URL);
    await apiFetch(new URL('/test', BASE_URL));

    const { url } = getFetchCallArgs();
    expect(url).toBe(`${BASE_URL}/test`);
  });
});
