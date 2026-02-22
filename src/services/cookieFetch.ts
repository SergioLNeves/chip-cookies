import type { CookieFetch } from '../types';
import { get } from './cookieStore';
import { toCookieString } from './cookieSerializer';

/**
 * Extrai o hostname de uma URL.
 */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Verifica se requestHost pertence ao mesmo domínio que baseHost.
 * Match exato ou subdomínio (ex: api.example.com matches example.com).
 */
function isSameDomain(baseHost: string, requestHost: string): boolean {
  if (baseHost === requestHost) return true;
  return requestHost.endsWith('.' + baseHost);
}

/**
 * Cria uma função fetch que automaticamente inclui cookies nas requisições.
 * Cookies só são anexados se o domínio do request pertence ao mesmo domínio do baseUrl.
 * Paths relativos são resolvidos como URLs absolutas contra o baseUrl.
 * @param baseUrl URL base da API (ex: 'https://api.example.com')
 * @returns Função fetch com cookies automáticos e isolamento de domínio
 *
 * @example
 * const apiFetch = createFetchWithCookies('https://api.example.com');
 * const response = await apiFetch('/user/profile');
 */
export function createFetchWithCookies(baseUrl: string): CookieFetch {
  const baseHostname = getHostname(baseUrl);

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    // Resolver URL absoluta
    let requestUrl: string;
    if (typeof input === 'string') {
      requestUrl = input.startsWith('/') ? `${baseUrl}${input}` : input;
    } else if (input instanceof URL) {
      requestUrl = input.toString();
    } else {
      requestUrl = input.url;
    }

    const requestHostname = getHostname(requestUrl);

    const headers = new Headers(init?.headers);

    // Só anexar cookies se domínios são compatíveis
    if (baseHostname && requestHostname && isSameDomain(baseHostname, requestHostname)) {
      let cookieString = '';
      try {
        const cookies = await get(baseUrl);
        cookieString = toCookieString(cookies);
      } catch {
        // Falha ao recuperar cookies — continua requisição sem cookies
      }

      if (cookieString) {
        headers.set('Cookie', cookieString);
      }
    }

    return fetch(requestUrl, { ...init, headers });
  };
}
