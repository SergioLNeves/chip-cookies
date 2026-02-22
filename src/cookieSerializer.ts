import type { CookieMap } from './ExpoChipCookies.types';

/**
 * Converte um CookieMap para string no formato Cookie header
 * @param cookies Mapa de cookies
 * @returns String no formato "name1=value1; name2=value2"
 */
export function toCookieString(cookies: CookieMap): string {
  return Object.values(cookies)
    .filter(c => c.name != null && c.value != null)
    .map(c => `${c.name}=${c.value.replace(/[\r\n]/g, '')}`)
    .join('; ');
}
