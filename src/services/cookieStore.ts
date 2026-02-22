import { requireOptionalNativeModule } from 'expo-modules-core';
import type { Cookie, CookieMap } from '../types';

const Module = requireOptionalNativeModule('ExpoChipCookies');

// Fallback in-memory store: hostname → cookie name → Cookie
const memoryStore = new Map<string, Map<string, Cookie>>();

function getStoreKey(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Define um cookie para uma URL específica.
 * Quando o módulo nativo está disponível, o valor é criptografado via Android Keystore (AES-256-GCM).
 * No Expo Go, usa store in-memory como fallback.
 * @param url URL base (ex: 'https://api.example.com')
 * @param cookie Objeto cookie com name, value e propriedades opcionais
 * @returns Promise<boolean> true se o cookie foi definido com sucesso
 */
export async function set(url: string, cookie: Cookie): Promise<boolean> {
  if (Module) {
    return await Module.set(url, cookie);
  }
  if (!cookie.name || typeof cookie.name !== 'string') {
    throw new Error("Cookie 'name' is required and must be a string");
  }
  if (typeof cookie.value !== 'string') {
    throw new Error("Cookie 'value' must be a string");
  }
  const key = getStoreKey(url);
  if (!memoryStore.has(key)) {
    memoryStore.set(key, new Map());
  }
  memoryStore.get(key)!.set(cookie.name, { ...cookie });
  return true;
}

/**
 * Recupera todos os cookies associados a uma URL.
 * Quando nativo, os valores são automaticamente descriptografados.
 * No Expo Go, retorna do store in-memory.
 * @param url URL base (ex: 'https://api.example.com')
 * @returns Promise<CookieMap> Mapa de cookies indexado por nome
 */
export async function get(url: string): Promise<CookieMap> {
  if (Module) {
    return await Module.get(url);
  }
  const key = getStoreKey(url);
  const cookies = memoryStore.get(key);
  if (!cookies) return {};
  const result: CookieMap = {};
  for (const [name, cookie] of cookies) {
    result[name] = { ...cookie };
  }
  return result;
}

/**
 * Remove todos os cookies armazenados
 * @returns Promise<boolean> true se os cookies foram removidos com sucesso
 */
export async function clearAll(): Promise<boolean> {
  if (Module) {
    return await Module.clearAll();
  }
  memoryStore.clear();
  return true;
}

/**
 * Remove cookies de uma URL específica (via Max-Age=0)
 * @param url URL cujos cookies serão removidos
 * @returns Promise<boolean> true se os cookies foram removidos
 */
export async function clear(url: string): Promise<boolean> {
  if (Module) {
    return await Module.clear(url);
  }
  const key = getStoreKey(url);
  memoryStore.delete(key);
  return true;
}

/**
 * Criptografa cookies plaintext existentes para uma URL.
 * NOTA: Atributos originais (Domain, HttpOnly, SameSite) não são preservados —
 * cookies migrados ficam com Path=/ e Secure. Redefina-os com set() se necessário.
 * No Expo Go, é um no-op.
 * @param url URL cujos cookies serão migrados
 * @returns Promise<number> Número de cookies migrados
 */
export async function migrateToEncrypted(url: string): Promise<number> {
  if (Module) {
    return await Module.migrateToEncrypted(url);
  }
  return 0;
}

/**
 * Remove todos os cookies e deleta a chave de criptografia do Keystore.
 * No Expo Go, limpa o store in-memory.
 * @returns Promise<boolean> true se o reset foi bem-sucedido
 */
export async function resetEncryption(): Promise<boolean> {
  if (Module) {
    return await Module.resetEncryption();
  }
  memoryStore.clear();
  return true;
}

/**
 * Força a persistência dos cookies no disco (Android).
 * No Expo Go, é um no-op.
 * @returns boolean — sempre true (flush do Android não reporta falhas)
 */
export function flush(): boolean {
  if (Module) {
    return Module.flush();
  }
  return true;
}
