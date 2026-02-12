# 🔨 Build e Publicação - expo-chip-cookies

## 📋 Pré-requisitos

Antes de construir e publicar o módulo, certifique-se de ter:

- [x] Node.js 18+ instalado
- [x] npm ou yarn
- [x] Android Studio (para testar Android)
- [x] Conta no npm (para publicar)
- [x] Git configurado

---

## 🏗️ Build Local

### 1. Instalar Dependências

```bash
cd /home/sergiolnrodrigues/Documentos/projects/chip-cookies

# Instalar dependências do módulo
npm install
```

### 2. Compilar TypeScript

```bash
# Compilar código TypeScript para JavaScript
npm run build

# Resultado em ./build/
```

### 3. Verificar Build

```bash
# Listar arquivos compilados
ls -la build/

# Deve conter:
# - index.js
# - index.d.ts
# - ExpoChipCookies.js
# - ExpoChipCookies.d.ts
# - ExpoChipCookies.types.js
# - ExpoChipCookies.types.d.ts
```

---

## 🧪 Testar Localmente

### Opção 1: Link Simbólico (npm link)

```bash
# No diretório do módulo
cd /home/sergiolnrodrigues/Documentos/projects/chip-cookies
npm link

# No projeto que vai usar
cd /home/sergiolnrodrigues/Documentos/projects/migos
npm link expo-chip-cookies

# Agora o módulo está linkado localmente
```

### Opção 2: Instalação por Caminho

```bash
cd /home/sergiolnrodrigues/Documentos/projects/migos

# Instalar diretamente do caminho local
npm install ../chip-cookies/expo-chip-cookies

# Ou no package.json:
# "expo-chip-cookies": "file:../chip-cookies/expo-chip-cookies"
```

### Opção 3: Testar com o Exemplo

```bash
cd /home/sergiolnrodrigues/Documentos/projects/chip-cookies/example

# Instalar dependências
npm install

# Gerar arquivos nativos
npx expo prebuild --platform android

# Executar
npx expo run:android
```

---

## 📦 Preparar para Publicação

### 1. Atualizar Metadados

Edite `package.json`:

```json
{
  "name": "expo-chip-cookies",
  "version": "0.1.0",
  "description": "Cookie management for React Native Expo with focus on session-based auth",
  "repository": {
    "type": "git",
    "url": "https://github.com/SEU_USERNAME/expo-chip-cookies.git"
  },
  "bugs": {
    "url": "https://github.com/SEU_USERNAME/expo-chip-cookies/issues"
  },
  "author": "Seu Nome <seu.email@example.com>",
  "license": "MIT",
  "homepage": "https://github.com/SEU_USERNAME/expo-chip-cookies#readme",
  "keywords": [
    "expo",
    "expo-module",
    "cookies",
    "session",
    "authentication",
    "android",
    "react-native"
  ]
}
```

### 2. Verificar Arquivos que Serão Publicados

```bash
# Simular publicação (dry-run)
npm pack --dry-run

# Ver arquivos incluídos
npm pack
tar -tzf expo-chip-cookies-0.1.0.tgz
```

### 3. Verificar .npmignore

Certifique-se de que arquivos desnecessários estão excluídos:

```
example/
.github/
.vscode/
src/
tsconfig.json
__tests__/
*.test.ts
docs/
.git/
.gitignore
.travis.yml
```

---

## 🚀 Publicar no npm

### 1. Login no npm

```bash
npm login

# Informe:
# - Username
# - Password
# - Email
# - OTP (se 2FA estiver ativado)
```

### 2. Verificar Versão

```bash
# Ver versão atual
npm version

# Atualizar versão (escolha uma)
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0
```

### 3. Publicar

```bash
# Build antes de publicar
npm run build

# Publicar no npm
npm publish

# Se for primeira versão beta:
npm publish --tag beta
```

### 4. Verificar Publicação

```bash
# Ver info do pacote
npm info expo-chip-cookies

# Visitar página npm
# https://www.npmjs.com/package/expo-chip-cookies
```

---

## 🔖 Criar Release no GitHub

### 1. Criar Repositório

```bash
cd /home/sergiolnrodrigues/Documentos/projects/chip-cookies

# Inicializar git
git init

# Adicionar arquivos
git add .

# Commit inicial
git commit -m "Initial commit - expo-chip-cookies v0.1.0"

# Adicionar remote
git remote add origin https://github.com/SEU_USERNAME/expo-chip-cookies.git

# Push
git push -u origin main
```

### 2. Criar Tag

```bash
# Criar tag
git tag -a v0.1.0 -m "Release v0.1.0 - MVP with Android support"

# Push tag
git push origin v0.1.0
```

### 3. Criar Release no GitHub

1. Acesse: `https://github.com/SEU_USERNAME/expo-chip-cookies/releases`
2. Clique em "Create a new release"
3. Selecione a tag `v0.1.0`
4. Adicione release notes:

```markdown
## 🎉 expo-chip-cookies v0.1.0

Primeiro lançamento do expo-chip-cookies - gerenciador de cookies nativo para React Native Expo.

### ✨ Features

- ✅ Suporte completo para Android
- ✅ API simples e intuitiva
- ✅ Helper para autenticação baseada em sessão
- ✅ Persistência confiável com CookieManager
- ✅ TypeScript com tipos completos

### 📦 Instalação

\`\`\`bash
npm install expo-chip-cookies
\`\`\`

### 📖 Documentação

- [README](./README.md)
- [Quick Start](./QUICKSTART.md)
- [Examples](./EXAMPLES.md)

### ⚠️ Requisitos

- Expo SDK 51+
- Android API 21+
- Dev build obrigatório (não funciona com Expo Go)

### 🐛 Known Issues

- iOS não implementado ainda (apenas Android)

---

**Full Changelog**: Initial release
```

---

## 🔄 Workflow de Atualização

### Quando Fazer Update

```bash
# 1. Fazer alterações no código
git add .
git commit -m "feat: add new feature X"

# 2. Atualizar versão
npm version patch  # ou minor/major

# 3. Build
npm run build

# 4. Push
git push origin main
git push --tags

# 5. Publicar
npm publish

# 6. Criar release no GitHub
```

---

## 🧹 Manutenção

### Limpar Build

```bash
npm run clean

# Ou manualmente
rm -rf build/
rm -rf node_modules/
rm -rf android/build/
```

### Reinstalar Dependências

```bash
npm run clean
npm install
```

### Verificar Outdated

```bash
npm outdated

# Atualizar dependências
npm update
```

---

## 📊 Checklist de Publicação

Antes de publicar, verifique:

- [ ] Código TypeScript compila sem erros (`npm run build`)
- [ ] Todos os testes passam (quando implementados)
- [ ] README.md está atualizado
- [ ] CHANGELOG.md atualizado (quando criado)
- [ ] Versão atualizada em package.json
- [ ] .npmignore configurado corretamente
- [ ] LICENSE presente
- [ ] Repositório Git configurado
- [ ] Tag de versão criada
- [ ] Testado localmente em projeto real
- [ ] Documentação revisada

---

## 🎯 Publicação Step-by-Step

### Primeira Publicação

```bash
# 1. Build
cd /home/sergiolnrodrigues/Documentos/projects/chip-cookies
npm install
npm run build

# 2. Verificar
npm pack --dry-run

# 3. Git
git init
git add .
git commit -m "chore: initial commit v0.1.0"
git remote add origin https://github.com/SEU_USERNAME/expo-chip-cookies.git
git push -u origin main
git tag v0.1.0
git push --tags

# 4. npm
npm login
npm publish

# 5. Verificar
npm info expo-chip-cookies
```

### Publicações Subsequentes

```bash
# 1. Fazer alterações
# ... código ...

# 2. Commit
git add .
git commit -m "feat: add feature X"

# 3. Versão
npm version patch

# 4. Build e publish
npm run build
git push origin main --tags
npm publish

# 5. Criar release no GitHub
```

---

## 🔐 Segurança

### npm 2FA

```bash
# Habilitar 2FA no npm
npm profile enable-2fa auth-and-writes

# Ao publicar, você precisará do código OTP
npm publish --otp=123456
```

### Verificar Vulnerabilidades

```bash
npm audit

# Corrigir automaticamente
npm audit fix
```

---

## 📈 Monitoramento Pós-Publicação

### npm Stats

```bash
# Downloads
npm info expo-chip-cookies downloads

# Versões
npm view expo-chip-cookies versions
```

### GitHub Stars

Acompanhe em: `https://github.com/SEU_USERNAME/expo-chip-cookies/stargazers`

---

## 🆘 Troubleshooting

### Erro: Package name taken

```bash
# Use scope no nome
npm publish --access public
# ou mude o nome em package.json
```

### Erro: Not logged in

```bash
npm logout
npm login
```

### Erro: 2FA required

```bash
npm publish --otp=CODIGO_2FA
```

---

## 📝 Template de CHANGELOG.md

Crie `CHANGELOG.md`:

```markdown
# Changelog

## [0.1.0] - 2026-02-12

### Added
- Initial release
- Android support
- Basic cookie operations (set, get, clearAll, flush)
- createFetchWithCookies helper
- Complete TypeScript types
- Example app

### Known Issues
- iOS not implemented yet
```

---

**Pronto para publicar!** 🚀
