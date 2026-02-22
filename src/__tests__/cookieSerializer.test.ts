import { toCookieString } from '../cookieSerializer';

describe('toCookieString()', () => {
  it('deve converter CookieMap para formato Cookie header', () => {
    const cookies = {
      a: { name: 'a', value: '1' },
      b: { name: 'b', value: '2' },
    };
    expect(toCookieString(cookies)).toBe('a=1; b=2');
  });

  it('deve retornar string vazia para mapa vazio', () => {
    expect(toCookieString({})).toBe('');
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
    expect(toCookieString(cookies)).toBe('good=ok');
  });

  it('deve filtrar cookies com value null', () => {
    const cookies = {
      good: { name: 'good', value: 'ok' },
      bad: { name: 'bad', value: null as unknown as string },
    };
    expect(toCookieString(cookies)).toBe('good=ok');
  });

  it('deve lidar com um único cookie', () => {
    const cookies = { only: { name: 'only', value: 'one' } };
    expect(toCookieString(cookies)).toBe('only=one');
  });

  it('deve preservar caracteres especiais válidos no value', () => {
    const cookies = {
      jwt: { name: 'token', value: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.sig' },
    };
    expect(toCookieString(cookies)).toBe('token=eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.sig');
  });
});
