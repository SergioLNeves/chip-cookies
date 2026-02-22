package expo.modules.chipcookies

import android.webkit.CookieManager
import android.webkit.ValueCallback
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.net.URL

class ExpoChipCookiesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoChipCookies")

    // set(url, cookie) - Define um cookie (validado + criptografado)
    AsyncFunction("set") { url: String, cookie: Map<String, Any>, promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()
        val domain = URL(url).host
        val cookieString = CookieSerializer.buildCookieString(cookie, domain)

        cookieManager.setCookie(url, cookieString)
        cookieManager.flush()

        promise.resolve(true)
      } catch (e: IllegalArgumentException) {
        promise.reject("ERR_VALIDATION", e.message, e)
      } catch (e: java.security.GeneralSecurityException) {
        promise.reject("ERR_CRYPTO", "Encryption failed: ${e.message}", e)
      } catch (e: Exception) {
        promise.reject("ERR_SET", e.message, e)
      }
    }

    // get(url) - Recupera cookies (descriptografados)
    AsyncFunction("get") { url: String, promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()
        val cookieString = cookieManager.getCookie(url)

        val cookies = if (cookieString != null) {
          CookieSerializer.parseCookiesWithDecryption(cookieString, url)
        } else {
          emptyMap<String, Any>()
        }

        promise.resolve(cookies)
      } catch (e: Exception) {
        promise.reject("ERR_GET", e.message, e)
      }
    }

    // clearAll() - Remove todos os cookies
    AsyncFunction("clearAll") { promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()

        cookieManager.removeAllCookies(ValueCallback { success ->
          if (success) {
            cookieManager.flush()
            promise.resolve(true)
          } else {
            promise.reject("ERR_CLEAR", "Failed to clear cookies", null)
          }
        })
      } catch (e: Exception) {
        promise.reject("ERR_CLEAR", e.message, e)
      }
    }

    // clear(url) - Remove cookies de uma URL específica
    AsyncFunction("clear") { url: String, promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()
        val cookieString = cookieManager.getCookie(url)

        if (cookieString != null) {
          cookieString.split(";").forEach { cookie ->
            val trimmed = cookie.trim()
            val name = trimmed.split("=", limit = 2).firstOrNull()?.trim()
            if (!name.isNullOrEmpty()) {
              // Deletar com e sem Path para cobrir cookies definidos em paths diferentes
              cookieManager.setCookie(url, "$name=; Max-Age=0; Path=/")
              cookieManager.setCookie(url, "$name=; Max-Age=0")
            }
          }
          cookieManager.flush()
        }

        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("ERR_CLEAR", e.message, e)
      }
    }

    // migrateToEncrypted(url) - Criptografa cookies plaintext existentes
    AsyncFunction("migrateToEncrypted") { url: String, promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()
        val cookieString = cookieManager.getCookie(url)
        var migratedCount = 0

        if (cookieString != null) {
          cookieString.split(";").forEach { cookie ->
            val trimmed = cookie.trim()
            val parts = trimmed.split("=", limit = 2)

            if (parts.size == 2) {
              val name = parts[0].trim()
              val value = parts[1].trim()

              if (!CookieCrypto.isEncrypted(value)) {
                val encrypted = CookieCrypto.encrypt(value)
                cookieManager.setCookie(url, "$name=$encrypted; Path=/; Secure")
                migratedCount++
              }
            }
          }
          if (migratedCount > 0) {
            cookieManager.flush()
          }
        }

        promise.resolve(migratedCount)
      } catch (e: java.security.GeneralSecurityException) {
        promise.reject("ERR_CRYPTO", "Migration encryption failed: ${e.message}", e)
      } catch (e: Exception) {
        promise.reject("ERR_MIGRATE", e.message, e)
      }
    }

    // resetEncryption() - Remove cookies e deleta chave do Keystore
    AsyncFunction("resetEncryption") { promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()

        cookieManager.removeAllCookies(ValueCallback { success ->
          if (success) {
            CookieCrypto.deleteKey()
            cookieManager.flush()
            promise.resolve(true)
          } else {
            promise.reject("ERR_RESET", "Failed to clear cookies before key deletion", null)
          }
        })
      } catch (e: Exception) {
        promise.reject("ERR_RESET", e.message, e)
      }
    }

    // flush() - Força persistência
    Function("flush") {
      CookieManager.getInstance().flush()
      true
    }
  }
}
