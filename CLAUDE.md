# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`expo-chip-cookies` is a native Expo module for cookie management in React Native, focused on session-based authentication. It provides a bridge between TypeScript and Android's native `CookieManager`, with iOS support planned.

**Key Context:**
- This is an **Expo Module** (not a standalone React Native app)
- Requires **dev builds** - does NOT work with Expo Go
- Android implementation uses `android.webkit.CookieManager` for persistent storage
- Cookies are shared between native HTTP requests and WebViews

## Development Commands

### Building the Module

```bash
# Build TypeScript to JavaScript (output to build/)
npm run build

# Clean build artifacts
npm run clean

# Lint code
npm run lint

# Run tests
npm run test
```

### Testing with Example App

The `example/` directory contains a test app:

```bash
cd example
npm install

# Generate native Android code (required after module changes)
npx expo prebuild --platform android

# Run on Android device/emulator
npx expo run:android

# Start dev server
npx expo start
```

### Local Testing in Another Project

```bash
# In target project (e.g., migos)
cd /path/to/other-project
npm install ../chip-cookies/expo-chip-cookies
npx expo prebuild
npx expo run:android
```

## Architecture

### Module Structure

```
TypeScript Layer (src/)
    ↓ (Expo Modules API)
Kotlin Native Layer (android/)
    ↓ (Android SDK)
android.webkit.CookieManager
```

### Key Components

**TypeScript Side (`src/`):**
- `ExpoChipCookies.ts` - Main API that calls native module via `NativeModulesProxy`
- `ExpoChipCookies.types.ts` - Cookie and CookieMap type definitions
- `index.ts` - Public exports

**Android Side (`android/`):**
- `ExpoChipCookiesModule.kt` - Expo Module implementation using Kotlin DSL
- Exposes 4 functions: `set()`, `get()`, `clearAll()`, `flush()`
- Uses `android.webkit.CookieManager.getInstance()` for storage
- Implements RFC 6265 cookie string formatting

**Bridge Configuration:**
- `expo-module.config.json` - Configures autolinking and native module registration
- Module name: `ExpoChipCookies`
- Android package: `expo.modules.chipcookies`

### Critical Implementation Details

1. **Cookie Persistence**: `flush()` MUST be called after `set()` operations on Android to force disk write
2. **Storage Location**: Android stores cookies in `/data/data/<package>/app_webview/Cookies`
3. **Cookie Format**: Uses Set-Cookie header format (RFC 6265) in `buildCookieString()`
4. **Parse Logic**: `parseCookies()` converts semicolon-separated strings to CookieMap
5. **Async Pattern**: All operations except `flush()` are async (use Promises)

## Working with Native Code

### Modifying Android Module

When changing `ExpoChipCookiesModule.kt`:

1. Make Kotlin changes
2. Rebuild example app: `cd example && npx expo prebuild --platform android`
3. Run: `npx expo run:android`

**Note**: Hot reload doesn't work for native changes - full rebuild required.

### Adding New Native Functions

Follow Expo Modules Kotlin DSL pattern:

```kotlin
// Async function (returns Promise)
AsyncFunction("functionName") { param: Type, promise: Promise ->
  try {
    // Implementation
    promise.resolve(result)
  } catch (e: Exception) {
    promise.reject("ERROR_CODE", e.message, e)
  }
}

// Sync function
Function("functionName") {
  // Implementation
  return result
}
```

Then add TypeScript wrapper in `src/ExpoChipCookies.ts`.

## API Usage Patterns

### Authentication Flow Pattern

The module is designed for session cookie-based auth:

```typescript
// Login: set session cookie
await ExpoChipCookies.set(API_URL, {
  name: 'session_id',
  value: token,
  secure: true,
  httpOnly: true,
});
ExpoChipCookies.flush(); // Critical!

// Authenticated requests
const apiFetch = ExpoChipCookies.createFetchWithCookies(API_URL);
const response = await apiFetch('/endpoint');

// Logout: clear cookies
await ExpoChipCookies.clearAll();
```

### Important Security Flags

Always use for auth cookies:
- `secure: true` - HTTPS only
- `httpOnly: true` - Not accessible via JavaScript
- `sameSite: 'Strict'` - CSRF protection

## Testing

### Manual Testing with httpbin.org

```typescript
const baseUrl = 'https://httpbin.org';
await ExpoChipCookies.set(baseUrl, { name: 'test', value: 'hello' });
const apiFetch = ExpoChipCookies.createFetchWithCookies(baseUrl);
const response = await apiFetch('/cookies');
const data = await response.json();
console.log(data.cookies); // Should contain { test: 'hello' }
```

### Example App Test Scenarios

The `example/App.tsx` includes:
- Basic set/get/clear operations
- Auth flow simulation
- Multiple cookies
- httpbin.org integration tests
- Real-time event logging

## Known Limitations

- **iOS not implemented** - Only Android currently supported
- **No Set-Cookie parsing** - Must manually extract cookies from response headers
- **No domain-specific clear** - `clearAll()` removes ALL cookies, not just for one domain
- **Requires dev build** - Cannot test with Expo Go

## Publishing Workflow

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Build
npm run build

# 3. Verify package contents
npm pack --dry-run

# 4. Publish
npm publish

# 5. Git tags
git push origin main --tags
```

Package includes: `build/`, `android/`, `README.md`, `LICENSE`, `expo-module.config.json`

Package excludes: `src/`, `example/`, `*.md` (except README), `tsconfig.json`

## Additional Documentation

- `README.md` - Complete API documentation and usage guide
- `.claude/QUICKSTART.md` - Integration guide for using in other projects
- `.claude/EXAMPLES.md` - Advanced usage patterns (refresh tokens, interceptors, etc.)
- `.claude/BUILD_AND_PUBLISH.md` - Detailed publishing instructions
