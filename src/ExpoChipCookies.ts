import { NativeModulesProxy } from 'expo-modules-core';
import type { Cookie, CookieMap } from './ExpoChipCookies.types';

const Module = NativeModulesProxy.ExpoChipCookies;

/**
 * Define um cookie para uma URL específica
 * @param url URL base (ex: 'https://api.example.com')
 * @param cookie Objeto cookie com name, value e propriedades opcionais
 * @returns Promise<boolean> true se o cookie foi definido com sucesso
 */
export async function set(url: string, cookie: Cookie): Promise<boolean> {
  return await Module.set(url, cookie);
}

/**
 * Recupera todos os cookies associados a uma URL
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
 * Cria uma função fetch que automaticamente inclui cookies nas requisições
 * @param baseUrl URL base da API (ex: 'https://api.example.com')
 * @returns Função fetch com cookies automáticos
 *
 * @example
 * const apiFetch = createFetchWithCookies('https://api.example.com');
 * const response = await apiFetch('/user/profile');
 */
export function createFetchWithCookies(baseUrl: string) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const cookies = await get(baseUrl);
    const cookieString = toCookieString(cookies);

    const headers = new Headers(init?.headers);
    if (cookieString) {
      headers.set('Cookie', cookieString);
    }

    return fetch(input, { ...init, headers });
  };
}
