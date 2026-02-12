# 🚀 Guia de Início Rápido - expo-chip-cookies

## 1. Instalação no Projeto Migos

```bash
cd /home/sergiolnrodrigues/Documentos/projects/migos

# Instalar localmente durante desenvolvimento
npm install ../chip-cookies/expo-chip-cookies

# Ou publicar no npm e instalar:
# npm install expo-chip-cookies
```

## 2. Configurar Dev Build

```bash
# Gerar arquivos nativos
npx expo prebuild --platform android

# Executar no Android
npx expo run:android
```

⚠️ **IMPORTANTE**: Este módulo **NÃO funciona com Expo Go**. É necessário um dev build.

## 3. Implementar Autenticação

### Estrutura Sugerida

```
src/
├── services/
│   ├── api.ts          # Cliente HTTP com cookies
│   └── auth.ts         # Lógica de autenticação
└── utils/
    └── cookies.ts      # Helpers de cookies
```

### Arquivo: `src/services/api.ts`

```typescript
import * as ExpoChipCookies from 'expo-chip-cookies';

const API_BASE_URL = 'https://your-api.com';

// Cria fetch com cookies automáticos
export const apiFetch = ExpoChipCookies.createFetchWithCookies(API_BASE_URL);

// Helper genérico para requisições
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiFetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Exporta URL base para uso em set/get
export { API_BASE_URL };
```

### Arquivo: `src/services/auth.ts`

```typescript
import * as ExpoChipCookies from 'expo-chip-cookies';
import { apiRequest, API_BASE_URL } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

/**
 * Realiza login e salva cookie de sessão
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  // Extrai Set-Cookie do header (se disponível)
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    // Parse o Set-Cookie e salva
    const sessionId = parseSessionId(setCookie);
    await ExpoChipCookies.set(API_BASE_URL, {
      name: 'session_id',
      value: sessionId,
      secure: true,
      httpOnly: true,
    });
    ExpoChipCookies.flush();
  }

  return response.json();
}

/**
 * Verifica se usuário está autenticado
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const cookies = await ExpoChipCookies.get(API_BASE_URL);
    return !!cookies.session_id;
  } catch {
    return false;
  }
}

/**
 * Recupera perfil do usuário autenticado
 */
export async function getProfile(): Promise<User> {
  return apiRequest<User>('/user/profile');
}

/**
 * Realiza logout e limpa cookies
 */
export async function logout(): Promise<void> {
  try {
    // Chama endpoint de logout no servidor
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Sempre limpa cookies localmente
    await ExpoChipCookies.clearAll();
  }
}

// Helper para extrair session_id do header Set-Cookie
function parseSessionId(setCookie: string): string {
  const match = setCookie.match(/session_id=([^;]+)/);
  return match ? match[1] : '';
}
```

### Arquivo: `src/utils/cookies.ts`

```typescript
import * as ExpoChipCookies from 'expo-chip-cookies';
import { API_BASE_URL } from '../services/api';

/**
 * Salva cookie de sessão
 */
export async function saveSessionCookie(sessionId: string): Promise<void> {
  await ExpoChipCookies.set(API_BASE_URL, {
    name: 'session_id',
    value: sessionId,
    secure: true,
    httpOnly: true,
    sameSite: 'Strict',
  });
  ExpoChipCookies.flush();
}

/**
 * Recupera todos os cookies
 */
export async function getAllCookies() {
  return ExpoChipCookies.get(API_BASE_URL);
}

/**
 * Limpa todos os cookies
 */
export async function clearAllCookies() {
  await ExpoChipCookies.clearAll();
}
```

## 4. Usar em Componentes React

### Login Screen

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { login } from '../services/auth';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const user = await login({ email, password });

      // Navega para tela principal
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? "Entrando..." : "Entrar"}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

### Profile Screen

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { getProfile, logout } from '../services/auth';

export function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (error) {
      // Cookie inválido/expirado - volta para login
      navigation.replace('Login');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  if (!user) return <Text>Carregando...</Text>;

  return (
    <View>
      <Text>Nome: {user.name}</Text>
      <Text>Email: {user.email}</Text>
      <Button title="Sair" onPress={handleLogout} />
    </View>
  );
}
```

### App Root (Verificação de Auth)

```typescript
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { checkAuth } from './services/auth';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    const authenticated = await checkAuth();
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  };

  if (isLoading) {
    return null; // ou Loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <Stack.Screen name="Profile" component={ProfileScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 5. Testar

### Teste 1: Login Local

```typescript
// No seu componente ou console
import * as ExpoChipCookies from 'expo-chip-cookies';

// Simular login
await ExpoChipCookies.set('https://your-api.com', {
  name: 'session_id',
  value: 'test_session_123',
  secure: true,
});

// Verificar
const cookies = await ExpoChipCookies.get('https://your-api.com');
console.log(cookies); // { session_id: {...} }
```

### Teste 2: httpbin.org

```typescript
const baseUrl = 'https://httpbin.org';

// Define cookie
await ExpoChipCookies.set(baseUrl, {
  name: 'test',
  value: 'hello',
});

// Faz requisição
const apiFetch = ExpoChipCookies.createFetchWithCookies(baseUrl);
const response = await apiFetch('/cookies');
const data = await response.json();

console.log(data.cookies); // { test: 'hello' }
```

## 6. Troubleshooting

### Cookies não são enviados

- ✅ Verifique se chamou `flush()` após `set()`
- ✅ Confirme que está usando o mesmo `baseUrl`
- ✅ Verifique se o cookie não expirou

### "Module not found"

- ✅ Execute `npx expo prebuild` novamente
- ✅ Limpe cache: `npx expo start -c`
- ✅ Reconstrua: `npx expo run:android`

### Cookies não persistem entre sessões

- ✅ Sempre chame `flush()` após `set()`
- ✅ Não use valores `maxAge` muito curtos
- ✅ Verifique se o app não foi desinstalado (apaga dados)

## 7. Próximos Passos

1. ✅ Implementar refresh token se necessário
2. ✅ Adicionar retry automático em caso de 401
3. ✅ Implementar logout global em erro de auth
4. ✅ Adicionar interceptor para renovar sessão

## 📚 Recursos Adicionais

- [README Completo](./README.md)
- [Exemplo de App](./example/App.tsx)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

---

**Dúvidas?** Abra uma issue no GitHub!
