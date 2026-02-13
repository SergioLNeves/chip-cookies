import { NativeModulesProxy } from 'expo-modules-core';
import type { Cookie, CookieMap } from './ExpoChipCookies.types';

const Module = NativeModulesProxy.ExpoChipCookies;

/**
 * Define um cookie para uma URL específica.
 * O valor é automaticamente criptografado via Android Keystore (AES-256-GCM).
 * O flag `secure` é sempre forçado como true.
 * @param url URL base (ex: 'https://api.example.com')
 * @param cookie Objeto cookie com name, value e propriedades opcionais
 * @returns Promise<boolean> true se o cookie foi definido com sucesso
 */
export async function set(url: string, cookie: Cookie): Promise<boolean> {
  return await Module.set(url, cookie);
}

/**
 * Recupera todos os cookies associados a uma URL.
 * Os valores são automaticamente descriptografados.
 * Cookies adulterados são silenciosamente ignorados.
 * @param url URL base (ex: 'https://api.example.com')
 * @returns Promise<CookieMap> Mapa de cookies indexado por nome
 */
export async function get(url: string): Promise<CookieMap> {
  return await Module.get(url);
}

/**
 * Remove todos os cookies armazenados
 * @returns Promise<boolean> true se os cookies foram removidos com sucesso
 */
export async function clearAll(): Promise<boolean> {
  return await Module.clearAll();
}

/**
 * Remove cookies de uma URL específica (via Max-Age=0)
 * @param url URL cujos cookies serão removidos
 * @returns Promise<boolean> true se os cookies foram removidos
 */
export async function clear(url: string): Promise<boolean> {
  return await Module.clear(url);
}

/**
 * Criptografa cookies plaintext existentes para uma URL.
 * Cookies já criptografados (prefixo cc_enc_v1:) são ignorados.
 * @param url URL cujos cookies serão migrados
 * @returns Promise<number> Número de cookies migrados
 */
export async function migrateToEncrypted(url: string): Promise<number> {
  return await Module.migrateToEncrypted(url);
}

/**
 * Remove todos os cookies e deleta a chave de criptografia do Keystore.
 * Usar para reset completo ou rotação de chave.
 * @returns Promise<boolean> true se o reset foi bem-sucedido
 */
export async function resetEncryption(): Promise<boolean> {
  return await Module.resetEncryption();
}

/**
 * Força a persistência dos cookies no disco (Android)
 * @returns boolean true sempre
 */
export function flush(): boolean {
  return Module.flush();
}

/**
 * Converte um CookieMap para string no formato Cookie header
 * @param cookies Mapa de cookies
 * @returns String no formato "name1=value1; name2=value2"
 */
export function toCookieString(cookies: CookieMap): string {
  return Object.values(cookies)
    .map(c => `${c.name}=${c.value}`)
    .join('; ');
}

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
export function createFetchWithCookies(baseUrl: string) {
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
      const cookies = await get(baseUrl);
      const cookieString = toCookieString(cookies);

      if (cookieString) {
        headers.set('Cookie', cookieString);
      }
    }

    return fetch(requestUrl, { ...init, headers });
  };
}
