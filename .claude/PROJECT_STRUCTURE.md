# 📂 Estrutura do Projeto - expo-chip-cookies

## 🌳 Árvore de Diretórios

```
chip-cookies/
│
├── 📱 android/                                  # Implementação Android nativa
│   ├── build.gradle                            # Configuração de build
│   └── src/main/java/expo/modules/chipcookies/
│       └── ExpoChipCookiesModule.kt            # Módulo Kotlin (140 linhas)
│
├── 💻 src/                                      # Código TypeScript
│   ├── ExpoChipCookies.types.ts                # Tipos (Cookie, CookieMap)
│   ├── ExpoChipCookies.ts                      # API principal (6 funções)
│   └── index.ts                                # Exportações públicas
│
├── 🎨 example/                                  # App de demonstração
│   ├── App.tsx                                 # Interface de teste completa
│   ├── app.json                                # Configuração Expo
│   └── package.json                            # Dependências
│
├── 📚 Documentação/
│   ├── README.md                               # Documentação completa
│   ├── QUICKSTART.md                           # Guia de início rápido
│   ├── EXAMPLES.md                             # Exemplos de uso avançado
│   ├── IMPLEMENTATION_SUMMARY.md               # Resumo da implementação
│   ├── BUILD_AND_PUBLISH.md                    # Guia de build e publicação
│   ├── PROJECT_STRUCTURE.md                    # Este arquivo
│   └── CLAUDE.md                               # Instruções para Claude
│
├── ⚙️ Configuração/
│   ├── package.json                            # Configuração do módulo npm
│   ├── expo-module.config.json                 # Configuração Expo Modules
│   ├── tsconfig.json                           # Configuração TypeScript
│   ├── .gitignore                              # Arquivos ignorados pelo Git
│   ├── .npmignore                              # Arquivos excluídos do npm
│   └── LICENSE                                 # Licença MIT
│
└── 🔨 Build/ (gerado)
    └── build/                                  # Arquivos compilados (não versionado)
        ├── index.js
        ├── index.d.ts
        ├── ExpoChipCookies.js
        ├── ExpoChipCookies.d.ts
        ├── ExpoChipCookies.types.js
        └── ExpoChipCookies.types.d.ts
```

---

## 📄 Descrição dos Arquivos

### 🔵 Código Fonte TypeScript

#### `src/ExpoChipCookies.types.ts` (13 linhas)
```typescript
// Define interfaces Cookie e CookieMap
// Tipos usados em toda a API
```

**Conteúdo:**
- `interface Cookie` - Estrutura de um cookie (name, value, domain, path, expires, etc.)
- `type CookieMap` - Mapa de cookies indexado por nome

---

#### `src/ExpoChipCookies.ts` (~150 linhas)
```typescript
// API principal do módulo
// Integra com módulo nativo Android
```

**Funções exportadas:**
- `set(url, cookie)` - Define um cookie
- `get(url)` - Recupera cookies
- `clearAll()` - Remove todos os cookies
- `flush()` - Força persistência
- `toCookieString(cookies)` - Converte para string
- `createFetchWithCookies(baseUrl)` - Cria fetch com cookies automáticos

---

#### `src/index.ts` (2 linhas)
```typescript
// Re-exporta tudo de ExpoChipCookies
// Ponto de entrada público do módulo
```

---

### 🟢 Código Fonte Android (Kotlin)

#### `android/src/main/java/expo/modules/chipcookies/ExpoChipCookiesModule.kt` (~140 linhas)
```kotlin
// Implementação nativa Android
// Usa android.webkit.CookieManager
```

**Componentes:**
- `ExpoChipCookiesModule` - Classe principal do módulo
- `set()` - AsyncFunction para definir cookie
- `get()` - AsyncFunction para recuperar cookies
- `clearAll()` - AsyncFunction para limpar cookies
- `flush()` - Function síncrona para persistência
- `buildCookieString()` - Helper para construir string RFC 6265
- `parseCookies()` - Helper para parse de cookies

**Tecnologias:**
- Expo Modules Kotlin API
- android.webkit.CookieManager
- Kotlin Coroutines (via AsyncFunction)

---

### 🎨 App de Exemplo

#### `example/App.tsx` (~280 linhas)
```typescript
// App React Native completo para testes
// Interface com botões e logs
```

**Features:**
- Testes básicos (set, get, clear)
- Testes avançados (auth flow, httpbin)
- Logger de eventos em tempo real
- UI organizada em cards
- Visualização de cookies em JSON

---

### 📚 Documentação

#### `README.md` (~400 linhas)
**Seções:**
1. Motivação
2. Instalação
3. Uso básico
4. Caso de uso: Autenticação por sessão
5. API completa
6. Requisitos
7. Testes
8. Como funciona
9. Segurança
10. Roadmap

---

#### `QUICKSTART.md` (~350 linhas)
**Seções:**
1. Instalação no projeto Migos
2. Configurar dev build
3. Implementar autenticação
4. Estrutura de arquivos sugerida
5. Componentes React
6. Testes
7. Troubleshooting

---

#### `EXAMPLES.md` (~450 linhas)
**Seções:**
1. Autenticação básica
2. Múltiplos cookies
3. Cookies com expiração
4. Interceptor HTTP
5. Refresh token
6. Logout global
7. Debug e monitoramento

---

#### `IMPLEMENTATION_SUMMARY.md` (~200 linhas)
**Conteúdo:**
- Status da implementação
- Estrutura completa
- Funcionalidades implementadas
- Checklist
- Métricas

---

#### `BUILD_AND_PUBLISH.md` (~400 linhas)
**Seções:**
1. Build local
2. Testar localmente
3. Preparar para publicação
4. Publicar no npm
5. Criar release no GitHub
6. Workflow de atualização
7. Manutenção

---

### ⚙️ Configuração

#### `package.json`
```json
{
  "name": "expo-chip-cookies",
  "version": "0.1.0",
  "main": "build/index.js",
  "types": "build/index.d.ts",
  "scripts": {
    "build": "expo-module build",
    "clean": "expo-module clean",
    ...
  },
  "peerDependencies": {
    "expo": "*",
    "react": "*",
    "react-native": "*"
  }
}
```

**Propósito:**
- Metadados do módulo npm
- Scripts de build
- Dependências

---

#### `expo-module.config.json`
```json
{
  "platforms": ["android", "ios"],
  "android": {
    "modules": ["expo.modules.chipcookies.ExpoChipCookiesModule"]
  }
}
```

**Propósito:**
- Configuração do Expo Modules autolinking
- Lista módulos nativos por plataforma

---

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./build",
    ...
  }
}
```

**Propósito:**
- Configuração do compilador TypeScript
- Define target, módulos, e output

---

#### `android/build.gradle`
```gradle
apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'

android {
  namespace "expo.modules.chipcookies"
  minSdkVersion 21
  targetSdkVersion 34
  ...
}
```

**Propósito:**
- Configuração de build Android
- Define SDK versions
- Integra Expo Modules Core

---

## 📊 Estatísticas

### Código

| Tipo | Arquivos | Linhas Aprox. |
|------|----------|---------------|
| TypeScript | 3 | ~165 |
| Kotlin | 1 | ~140 |
| Config | 4 | ~100 |
| **Total Código** | **8** | **~405** |

### Documentação

| Arquivo | Linhas Aprox. |
|---------|---------------|
| README.md | ~400 |
| QUICKSTART.md | ~350 |
| EXAMPLES.md | ~450 |
| IMPLEMENTATION_SUMMARY.md | ~200 |
| BUILD_AND_PUBLISH.md | ~400 |
| PROJECT_STRUCTURE.md | ~250 |
| **Total Docs** | **~2050** |

### App de Exemplo

| Arquivo | Linhas |
|---------|--------|
| App.tsx | ~280 |

---

## 🎯 Arquivos Críticos para Funcionamento

### Mínimo Necessário

1. ✅ `src/index.ts` - Ponto de entrada
2. ✅ `src/ExpoChipCookies.ts` - API TypeScript
3. ✅ `src/ExpoChipCookies.types.ts` - Tipos
4. ✅ `android/.../ExpoChipCookiesModule.kt` - Implementação nativa
5. ✅ `android/build.gradle` - Build Android
6. ✅ `expo-module.config.json` - Configuração Expo
7. ✅ `package.json` - Metadados npm

### Documentação Essencial

1. ✅ `README.md` - Documentação principal
2. ✅ `LICENSE` - Licença do projeto

---

## 🔄 Fluxo de Dados

```
┌─────────────┐
│   App.tsx   │  <- Usa a API
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  src/ExpoChipCookies.ts     │  <- API TypeScript
└──────┬──────────────────────┘
       │ (chama NativeModulesProxy)
       ▼
┌─────────────────────────────┐
│  ExpoChipCookiesModule.kt   │  <- Módulo Kotlin
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  android.webkit.CookieManager│  <- Sistema Android
└─────────────────────────────┘
```

---

## 📦 Arquivos Incluídos no Pacote npm

Quando publicado, o pacote incluirá:

```
✅ build/                 # Código compilado
✅ android/               # Código nativo Android
✅ README.md              # Documentação
✅ LICENSE                # Licença
✅ expo-module.config.json # Configuração
✅ package.json           # Metadados

❌ src/                   # Código fonte TypeScript (excluído)
❌ example/               # App de exemplo (excluído)
❌ *.md (exceto README)   # Outras docs (excluídas)
❌ tsconfig.json          # Config TypeScript (excluído)
```

---

## 🎨 Estrutura Visual

```
expo-chip-cookies
│
├─📱 ANDROID NATIVO (Kotlin)
│  └─ CookieManager integration
│
├─💻 API TYPESCRIPT
│  ├─ set/get/clearAll/flush
│  └─ createFetchWithCookies helper
│
├─🎨 EXEMPLO
│  └─ App completo com testes
│
├─📚 DOCS
│  ├─ Guia completo
│  ├─ Quick start
│  └─ Exemplos avançados
│
└─⚙️ CONFIG
   ├─ npm package
   ├─ Expo module
   └─ TypeScript
```

---

## 🚀 Como Navegar no Projeto

### Para Usuários

1. **Começar**: `README.md`
2. **Integrar rapidamente**: `QUICKSTART.md`
3. **Ver exemplos**: `EXAMPLES.md`

### Para Desenvolvedores

1. **Entender implementação**: `IMPLEMENTATION_SUMMARY.md`
2. **Código TypeScript**: `src/ExpoChipCookies.ts`
3. **Código Android**: `android/.../ExpoChipCookiesModule.kt`
4. **App de teste**: `example/App.tsx`

### Para Publicação

1. **Build e deploy**: `BUILD_AND_PUBLISH.md`
2. **Estrutura**: Este arquivo

---

**Projeto 100% completo e documentado!** ✅
