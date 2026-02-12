# 📚 Exemplos de Uso - expo-chip-cookies

## Índice

1. [Autenticação Básica](#1-autenticação-básica)
2. [Múltiplos Cookies](#2-múltiplos-cookies)
3. [Cookies com Expiração](#3-cookies-com-expiração)
4. [Interceptor HTTP](#4-interceptor-http)
5. [Refresh Token](#5-refresh-token)
6. [Logout Global](#6-logout-global)
7. [Debug e Monitoramento](#7-debug-e-monitoramento)

---

## 1. Autenticação Básica

### Login e Salvamento de Cookie

```typescript
import * as ExpoChipCookies from 'expo-chip-cookies';

const API_URL = 'https://api.example.com';

async function login(email: string, password: string) {
  // 1. Faz requisição de login
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login falhou');
  }

  const data = await response.json();

  // 2. Salva cookie de sessão
  await ExpoChipCookies.set(API_URL, {
    name: 'session_id',
    value: data.sessionId,
    secure: true,
    httpOnly: true,
  });

  // 3. Força persistência
  ExpoChipCookies.flush();

  return data.user;
}
```

### Verificar Autenticação

```typescript
async function isAuthenticated(): Promise<boolean> {
  try {
    const cookies = await ExpoChipCookies.get(API_URL);
    return cookies.session_id !== undefined;
  } catch {
    return false;
  }
}
```

### Fazer Requisições Autenticadas

```typescript
const apiFetch = ExpoChipCookies.createFetchWithCookies(API_URL);

async function getUserProfile() {
  const response = await apiFetch('/user/profile');
  return response.json();
}

async function updateProfile(data: any) {
  const response = await apiFetch('/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

---

## 2. Múltiplos Cookies

### Salvar Vários Cookies

```typescript
async function saveMultipleCookies() {
  const baseUrl = 'https://api.example.com';

  // Cookie de sessão
  await ExpoChipCookies.set(baseUrl, {
    name: 'session_id',
    value: 'abc123',
    secure: true,
    httpOnly: true,
  });

  // Cookie de preferências
  await ExpoChipCookies.set(baseUrl, {
    name: 'user_preferences',
    value: JSON.stringify({ theme: 'dark', lang: 'pt-BR' }),
    maxAge: 31536000, // 1 ano
  });

  // Cookie de tracking
  await ExpoChipCookies.set(baseUrl, {
    name: 'analytics_id',
    value: 'user_12345',
    maxAge: 7776000, // 90 dias
  });

  ExpoChipCookies.flush();
}
```

### Recuperar e Usar Cookies Específicos

```typescript
async function getSpecificCookie(cookieName: string) {
  const cookies = await ExpoChipCookies.get('https://api.example.com');
  return cookies[cookieName];
}

// Uso
const sessionCookie = await getSpecificCookie('session_id');
console.log(sessionCookie.value);
```

---

## 3. Cookies com Expiração

### Cookie com Tempo de Vida

```typescript
async function setTemporaryCookie() {
  await ExpoChipCookies.set('https://api.example.com', {
    name: 'temp_token',
    value: 'xyz789',
    maxAge: 3600, // Expira em 1 hora (3600 segundos)
    secure: true,
  });
  ExpoChipCookies.flush();
}
```

### Cookie com Data de Expiração

```typescript
async function setExpiringCookie() {
  // Expira em 7 dias
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  await ExpoChipCookies.set('https://api.example.com', {
    name: 'remember_me',
    value: 'user_token',
    expires: expiryDate.toUTCString(),
    secure: true,
  });
  ExpoChipCookies.flush();
}
```

---

## 4. Interceptor HTTP

### Cliente HTTP com Retry Automático

```typescript
import * as ExpoChipCookies from 'expo-chip-cookies';

const API_URL = 'https://api.example.com';

class ApiClient {
  private apiFetch = ExpoChipCookies.createFetchWithCookies(API_URL);

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await this.apiFetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Se 401, tenta refresh token
    if (response.status === 401) {
      const refreshed = await this.refreshSession();

      if (refreshed) {
        // Tenta novamente
        return this.request<T>(endpoint, options);
      } else {
        // Logout forçado
        await this.logout();
        throw new Error('Sessão expirada');
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  private async refreshSession(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();

        await ExpoChipCookies.set(API_URL, {
          name: 'session_id',
          value: data.newSessionId,
          secure: true,
          httpOnly: true,
        });
        ExpoChipCookies.flush();

        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private async logout() {
    await ExpoChipCookies.clearAll();
    // Redirecionar para login
  }
}

// Uso
const apiClient = new ApiClient();
const user = await apiClient.request('/user/profile');
```

---

## 5. Refresh Token

### Implementação Completa

```typescript
import * as ExpoChipCookies from 'expo-chip-cookies';

const API_URL = 'https://api.example.com';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Login com access e refresh tokens
 */
async function loginWithRefresh(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  // Salva access token (curta duração)
  await ExpoChipCookies.set(API_URL, {
    name: 'access_token',
    value: data.accessToken,
    maxAge: 900, // 15 minutos
    secure: true,
    httpOnly: true,
  });

  // Salva refresh token (longa duração)
  await ExpoChipCookies.set(API_URL, {
    name: 'refresh_token',
    value: data.refreshToken,
    maxAge: 2592000, // 30 dias
    secure: true,
    httpOnly: true,
  });

  ExpoChipCookies.flush();
}

/**
 * Renova access token usando refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const cookies = await ExpoChipCookies.get(API_URL);
    const refreshToken = cookies.refresh_token?.value;

    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refresh_token=${refreshToken}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Atualiza access token
    await ExpoChipCookies.set(API_URL, {
      name: 'access_token',
      value: data.accessToken,
      maxAge: 900, // 15 minutos
      secure: true,
      httpOnly: true,
    });

    ExpoChipCookies.flush();
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch com refresh automático
 */
async function fetchWithAutoRefresh(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const apiFetch = ExpoChipCookies.createFetchWithCookies(API_URL);

  let response = await apiFetch(endpoint, options);

  // Se 401, tenta refresh
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Tenta novamente com novo token
      response = await apiFetch(endpoint, options);
    }
  }

  return response;
}
```

---

## 6. Logout Global

### Logout com Limpeza Completa

```typescript
import * as ExpoChipCookies from 'expo-chip-cookies';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function globalLogout() {
  try {
    // 1. Notifica servidor
    const apiFetch = ExpoChipCookies.createFetchWithCookies(API_URL);
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Erro ao notificar logout:', error);
  } finally {
    // 2. Limpa cookies
    await ExpoChipCookies.clearAll();

    // 3. Limpa AsyncStorage
    await AsyncStorage.clear();

    // 4. Limpa outros estados (Redux, Zustand, etc.)
    // store.dispatch(resetState());

    // 5. Redireciona para login
    // navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }
}
```

---

## 7. Debug e Monitoramento

### Logger de Cookies

```typescript
import * as ExpoChipCookies from 'expo-chip-cookies';

async function logCookies(label: string = 'Cookies') {
  const cookies = await ExpoChipCookies.get('https://api.example.com');

  console.log(`\n=== ${label} ===`);
  console.log(`Total: ${Object.keys(cookies).length}`);

  Object.values(cookies).forEach(cookie => {
    console.log(`- ${cookie.name}: ${cookie.value}`);
    console.log(`  Domain: ${cookie.domain}`);
    console.log(`  Path: ${cookie.path}`);
  });
  console.log('===============\n');
}

// Uso
await logCookies('Cookies após login');
```

### Monitor de Cookies em Desenvolvimento

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import * as ExpoChipCookies from 'expo-chip-cookies';

export function CookieDebugger() {
  const [cookies, setCookies] = useState<any>({});

  const loadCookies = async () => {
    const result = await ExpoChipCookies.get('https://api.example.com');
    setCookies(result);
  };

  useEffect(() => {
    loadCookies();
    const interval = setInterval(loadCookies, 2000); // Atualiza a cada 2s
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        Cookies Debug ({Object.keys(cookies).length})
      </Text>

      <Button title="Refresh" onPress={loadCookies} />
      <Button title="Clear All" onPress={() => ExpoChipCookies.clearAll()} />

      {Object.values(cookies).map((cookie: any) => (
        <View key={cookie.name} style={{ marginTop: 10 }}>
          <Text>Name: {cookie.name}</Text>
          <Text>Value: {cookie.value}</Text>
          <Text>Domain: {cookie.domain}</Text>
        </View>
      ))}
    </View>
  );
}
```

### Teste de Integração

```typescript
import * as ExpoChipCookies from 'expo-chip-cookies';

async function testCookieFlow() {
  const testUrl = 'https://httpbin.org';

  console.log('🧪 Iniciando teste de cookies...');

  // 1. Limpa cookies
  await ExpoChipCookies.clearAll();
  console.log('✅ Cookies limpos');

  // 2. Define cookie
  await ExpoChipCookies.set(testUrl, {
    name: 'test_cookie',
    value: 'hello_world',
  });
  ExpoChipCookies.flush();
  console.log('✅ Cookie definido');

  // 3. Verifica se foi salvo
  const cookies = await ExpoChipCookies.get(testUrl);
  console.assert(
    cookies.test_cookie?.value === 'hello_world',
    'Cookie não foi salvo corretamente'
  );
  console.log('✅ Cookie recuperado');

  // 4. Testa requisição
  const apiFetch = ExpoChipCookies.createFetchWithCookies(testUrl);
  const response = await apiFetch('/cookies');
  const data = await response.json();

  console.assert(
    data.cookies.test_cookie === 'hello_world',
    'Cookie não foi enviado na requisição'
  );
  console.log('✅ Cookie enviado na requisição');

  // 5. Limpa
  await ExpoChipCookies.clearAll();
  const emptyCookies = await ExpoChipCookies.get(testUrl);
  console.assert(
    Object.keys(emptyCookies).length === 0,
    'Cookies não foram limpos'
  );
  console.log('✅ Cookies limpos com sucesso');

  console.log('🎉 Todos os testes passaram!');
}

// Executar teste
testCookieFlow();
```

---

## 📌 Dicas Adicionais

### Segurança

```typescript
// ✅ BOM - Cookie seguro
await ExpoChipCookies.set(url, {
  name: 'session',
  value: token,
  secure: true,      // Apenas HTTPS
  httpOnly: true,    // Não acessível via JS
  sameSite: 'Strict', // Proteção CSRF
});

// ❌ RUIM - Cookie inseguro
await ExpoChipCookies.set(url, {
  name: 'session',
  value: token,
  // Sem flags de segurança
});
```

### Performance

```typescript
// ✅ BOM - Flush após múltiplos sets
await ExpoChipCookies.set(url, cookie1);
await ExpoChipCookies.set(url, cookie2);
await ExpoChipCookies.set(url, cookie3);
ExpoChipCookies.flush(); // Uma vez no final

// ❌ RUIM - Flush múltiplas vezes
await ExpoChipCookies.set(url, cookie1);
ExpoChipCookies.flush();
await ExpoChipCookies.set(url, cookie2);
ExpoChipCookies.flush();
await ExpoChipCookies.set(url, cookie3);
ExpoChipCookies.flush();
```

---

**Mais exemplos?** Confira o [app de exemplo](./example/App.tsx)!
