# 🍪 expo-chip-cookies

Gerenciador de cookies nativo para React Native Expo, com foco em autenticação baseada em sessão (session cookie-based auth).

## 🎯 Motivação

Bibliotecas existentes como `@react-native-cookies/cookies` estão deprecated, e `@preeternal/react-native-cookie-manager` não funciona totalmente com Expo (requer bare React Native). O `expo-chip-cookies` foi criado para preencher essa lacuna, oferecendo:

- ✅ Funcionamento nativo com Expo (usando Expo Modules API)
- ✅ Suporte inicial para Android
- ✅ Armazenamento confiável usando `android.webkit.CookieManager`
- ✅ API simples e focada em casos de uso de autenticação
- ✅ Helper para inclusão automática de cookies em requisições

## 📦 Instalação

```bash
npm install chip-cookies
```

ou

```bash
yarn add chip-cookies
```

**⚠️ IMPORTANTE**: Este módulo requer um dev build (não funciona com Expo Go):

```bash
npx expo prebuild
npx expo run:android
```

## 🚀 Uso Básico

### Definir um cookie

```typescript
import * as ExpoChipCookies from 'chip-cookies';

await ExpoChipCookies.set('https://api.example.com', {
  name: 'session_id',
  value: 'abc123xyz',
  secure: true,
  httpOnly: true,
});

// Força persistência no disco (importante no Android)
ExpoChipCookies.flush();
```

### Recuperar cookies

```typescript
const cookies = await ExpoChipCookies.get('https://api.example.com');
console.log(cookies);
// { session_id: { name: 'session_id', value: 'abc123xyz', domain: 'api.example.com', path: '/' } }
```

### Limpar todos os cookies

```typescript
await ExpoChipCookies.clearAll();
```

## 🔐 Caso de Uso: Autenticação por Sessão

### Fluxo de Login

```typescript
import * as ExpoChipCookies from 'chip-cookies';

const API_BASE = 'https://api.example.com';

// 1. Login - recebe Set-Cookie do servidor
async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  // O servidor retorna Set-Cookie: session_id=xyz; HttpOnly; Secure
  // Salve manualmente (ou use setCookie do response headers)
  await ExpoChipCookies.set(API_BASE, {
    name: 'session_id',
    value: 'valor_do_cookie_recebido',
    secure: true,
    httpOnly: true,
  });

  ExpoChipCookies.flush();
  return response.json();
}
```

### Requisições Autenticadas (Forma Manual)

```typescript
async function getProfile() {
  const cookies = await ExpoChipCookies.get(API_BASE);
  const cookieString = ExpoChipCookies.toCookieString(cookies);

  const response = await fetch(`${API_BASE}/user/profile`, {
    headers: {
      'Cookie': cookieString,
    },
  });

  return response.json();
}
```

### Requisições Autenticadas (Usando Helper)

```typescript
// Cria função fetch que inclui cookies automaticamente
const apiFetch = ExpoChipCookies.createFetchWithCookies(API_BASE);

// Todas as requisições agora incluem cookies automaticamente
async function getProfile() {
  const response = await apiFetch('/user/profile');
  return response.json();
}

async function updateSettings(data: any) {
  const response = await apiFetch('/user/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

### Logout

```typescript
async function logout() {
  // 1. Chama endpoint de logout no servidor
  const apiFetch = ExpoChipCookies.createFetchWithCookies(API_BASE);
  await apiFetch('/auth/logout', { method: 'POST' });

  // 2. Limpa cookies localmente
  await ExpoChipCookies.clearAll();
}
```

## 📖 API Completa

### `set(url: string, cookie: Cookie): Promise<boolean>`

Define um cookie para uma URL específica.

**Parâmetros:**
- `url`: URL base (ex: `'https://api.example.com'`)
- `cookie`: Objeto cookie

```typescript
interface Cookie {
  name: string;          // Nome do cookie (obrigatório)
  value: string;         // Valor do cookie (obrigatório)
  domain?: string;       // Domínio (padrão: extraído da URL)
  path?: string;         // Caminho (padrão: '/')
  expires?: string;      // Data de expiração (formato RFC)
  maxAge?: number;       // Tempo de vida em segundos
  secure?: boolean;      // Apenas HTTPS
  httpOnly?: boolean;    // Não acessível via JavaScript
  sameSite?: 'Strict' | 'Lax' | 'None'; // Política SameSite
}
```

**Exemplo:**

```typescript
await ExpoChipCookies.set('https://api.example.com', {
  name: 'token',
  value: 'abc123',
  secure: true,
  httpOnly: true,
  maxAge: 86400, // 24 horas
  sameSite: 'Strict',
});
```

### `get(url: string): Promise<CookieMap>`

Recupera todos os cookies associados a uma URL.

**Retorno:**

```typescript
type CookieMap = Record<string, Cookie>;
```

**Exemplo:**

```typescript
const cookies = await ExpoChipCookies.get('https://api.example.com');
// { token: { name: 'token', value: 'abc123', ... } }
```

### `clearAll(): Promise<boolean>`

Remove todos os cookies armazenados.

```typescript
await ExpoChipCookies.clearAll();
```

### `flush(): boolean`

Força a persistência dos cookies no disco (Android). Recomendado chamar após `set()`.

```typescript
ExpoChipCookies.flush();
```

### `toCookieString(cookies: CookieMap): string`

Converte um `CookieMap` para string no formato Cookie header.

```typescript
const cookies = await ExpoChipCookies.get('https://api.example.com');
const cookieString = ExpoChipCookies.toCookieString(cookies);
// "token=abc123; session_id=xyz789"
```

### `clear(url: string): Promise<boolean>`

Remove cookies de uma URL específica (via Max-Age=0).

```typescript
await ExpoChipCookies.clear('https://api.example.com');
```

### `migrateToEncrypted(url: string): Promise<number>`

Criptografa cookies plaintext existentes para uma URL.
**Nota:** Atributos originais (Domain, HttpOnly, SameSite) não são preservados — cookies migrados ficam com Path=/ e Secure. Redefina-os com `set()` se necessário.

```typescript
const migrated = await ExpoChipCookies.migrateToEncrypted('https://api.example.com');
console.log(`${migrated} cookies migrados para criptografia`);
```

### `resetEncryption(): Promise<boolean>`

Remove todos os cookies e deleta a chave de criptografia do Android Keystore. Use quando precisar resetar completamente o estado de criptografia.

```typescript
await ExpoChipCookies.resetEncryption();
```

### `createFetchWithCookies(baseUrl: string): CookieFetch`

Cria uma função fetch que automaticamente inclui cookies nas requisições.

```typescript
const apiFetch = ExpoChipCookies.createFetchWithCookies('https://api.example.com');

// Cookies são incluídos automaticamente
const response = await apiFetch('/endpoint');
const data = await apiFetch('/other', {
  method: 'POST',
  body: JSON.stringify({ foo: 'bar' }),
});
```

## ⚙️ Requisitos

- **Expo SDK**: 51+ (recomendado)
- **Android**: API 21+ (Android 5.0 Lollipop)
- **iOS**: Em desenvolvimento
- **Dev Build**: Obrigatório (não funciona com Expo Go)

## 🧪 Testando

### Testar com httpbin.org

O httpbin.org é perfeito para testar cookies pois retorna os cookies recebidos:

```typescript
const baseUrl = 'https://httpbin.org';

// Define um cookie
await ExpoChipCookies.set(baseUrl, {
  name: 'test',
  value: 'hello',
});

// Faz requisição e verifica
const apiFetch = ExpoChipCookies.createFetchWithCookies(baseUrl);
const response = await apiFetch('/cookies');
const data = await response.json();

console.log(data.cookies); // { test: 'hello' }
```

### Executar o app de exemplo

```bash
cd example
npm install
npx expo prebuild --platform android
npx expo run:android
```

## 🏗️ Como Funciona

### Android

- Usa `android.webkit.CookieManager` para armazenamento nativo
- Cookies são persistidos em `/data/data/<package>/app_webview/Cookies`
- Cookies são compartilhados entre requisições HTTP nativas e WebViews
- Flags `secure` e `httpOnly` são respeitadas pelo sistema
 
## 🔒 Segurança

### Boas Práticas

1. **Sempre use `secure: true`** para APIs HTTPS
2. **Use `httpOnly: true`** para cookies de autenticação
3. **Configure `sameSite`** para proteção CSRF
4. **Chame `flush()`** após definir cookies importantes
5. **Limpe cookies no logout** usando `clearAll()`

### Exemplo Seguro

```typescript
await ExpoChipCookies.set('https://api.example.com', {
  name: 'session',
  value: sessionToken,
  secure: true,      // ✅ Apenas HTTPS
  httpOnly: true,    // ✅ Não acessível via JS
  sameSite: 'Strict', // ✅ Proteção CSRF
  maxAge: 3600,      // ✅ Expira em 1 hora
});
```
