import { set, get, clear, clearAll, flush, migrateToEncrypted, resetEncryption } from '../cookieStore';

const BASE_URL = 'https://api.example.com';

beforeEach(async () => {
  await clearAll();
});

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

  it('deve preservar propriedades opcionais do cookie', async () => {
    await set(BASE_URL, {
      name: 'session',
      value: 'xyz',
      secure: true,
      httpOnly: true,
      sameSite: 'Strict',
    });
    const cookies = await get(BASE_URL);
    expect(cookies.session.secure).toBe(true);
    expect(cookies.session.httpOnly).toBe(true);
    expect(cookies.session.sameSite).toBe('Strict');
  });
});

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

  it('deve lidar com URL inválida usando URL como chave', async () => {
    await set('not-a-url', { name: 'x', value: '1' });
    const cookies = await get('not-a-url');
    expect(cookies.x.value).toBe('1');
  });
});

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
    expect(await get('https://a.com')).toEqual({});
    expect((await get('https://b.com')).y.value).toBe('2');
  });

  it('deve retornar true mesmo sem cookies para limpar', async () => {
    const result = await clear('https://nenhum.com');
    expect(result).toBe(true);
  });
});

describe('clearAll()', () => {
  it('deve remover cookies de todas as URLs', async () => {
    await set('https://a.com', { name: 'x', value: '1' });
    await set('https://b.com', { name: 'y', value: '2' });
    await clearAll();
    expect(await get('https://a.com')).toEqual({});
    expect(await get('https://b.com')).toEqual({});
  });
});

describe('flush()', () => {
  it('deve retornar true (no-op no fallback)', () => {
    expect(flush()).toBe(true);
  });
});

describe('migrateToEncrypted()', () => {
  it('deve retornar 0 no fallback (no-op)', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc' });
    const count = await migrateToEncrypted(BASE_URL);
    expect(count).toBe(0);
  });
});

describe('resetEncryption()', () => {
  it('deve limpar o store in-memory e retornar true', async () => {
    await set(BASE_URL, { name: 'token', value: 'abc' });
    const result = await resetEncryption();
    expect(result).toBe(true);
    expect(await get(BASE_URL)).toEqual({});
  });
});
