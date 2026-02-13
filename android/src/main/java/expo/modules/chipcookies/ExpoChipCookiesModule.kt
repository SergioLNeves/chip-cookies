package expo.modules.chipcookies

import android.webkit.CookieManager
import android.webkit.ValueCallback
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.net.URL
import javax.crypto.AEADBadTagException

class ExpoChipCookiesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoChipCookies")

    // set(url, cookie) - Define um cookie (validado + criptografado)
    AsyncFunction("set") { url: String, cookie: Map<String, Any>, promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()
        val domain = URL(url).host
        val cookieString = buildCookieString(cookie, domain)

        cookieManager.setCookie(url, cookieString)
        cookieManager.flush()

        promise.resolve(true)
      } catch (e: IllegalArgumentException) {
        promise.reject("ERR_VALIDATION", e.message, e)
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
          parseCookiesWithDecryption(cookieString, url)
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
              // Setar com Max-Age=0 deleta o cookie
              cookieManager.setCookie(url, "$name=; Max-Age=0; Path=/")
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
      } catch (e: Exception) {
        promise.reject("ERR_MIGRATE", e.message, e)
      }
    }

    // resetEncryption() - Remove cookies e deleta chave do Keystore
    AsyncFunction("resetEncryption") { promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()

        cookieManager.removeAllCookies(ValueCallback { _ ->
          CookieCrypto.deleteKey()
          cookieManager.flush()
          promise.resolve(true)
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

  /**
   * Constrói string de cookie no formato Set-Cookie RFC 6265.
   * Aplica validação em todos os campos e criptografia no valor.
   * Secure é forçado sempre como true.
   */
  private fun buildCookieString(cookie: Map<String, Any>, domain: String): String {
    val name = CookieValidator.validateName(cookie["name"] as String)
    val rawValue = cookie["value"] as String
    val sanitizedValue = CookieValidator.sanitizeValue(rawValue)
    val encryptedValue = CookieCrypto.encrypt(sanitizedValue)
    val parts = mutableListOf("$name=$encryptedValue")

    // Domain (validado)
    val cookieDomain = cookie["domain"] as? String ?: domain
    parts.add("Domain=${CookieValidator.validateDomain(cookieDomain)}")

    // Path (validado)
    val path = cookie["path"] as? String ?: "/"
    parts.add("Path=${CookieValidator.validatePath(path)}")

    // Expires
    (cookie["expires"] as? String)?.let { parts.add("Expires=$it") }

    // Max-Age
    (cookie["maxAge"] as? Number)?.let { parts.add("Max-Age=$it") }

    // Secure - forçado sempre
    parts.add("Secure")

    // HttpOnly
    if (cookie["httpOnly"] as? Boolean == true) {
      parts.add("HttpOnly")
    }

    // SameSite (validado)
    (cookie["sameSite"] as? String)?.let {
      parts.add("SameSite=${CookieValidator.validateSameSite(it)}")
    }

    return parts.joinToString("; ")
  }

  /**
   * Parse string de cookies do CookieManager com descriptografia.
   * Cookies adulterados (AEADBadTagException) são silenciosamente ignorados.
   * Cookies sem prefixo cc_enc_v1: são retornados como estão (migração).
   */
  private fun parseCookiesWithDecryption(
    cookieString: String,
    url: String
  ): Map<String, Map<String, String>> {
    val cookies = mutableMapOf<String, Map<String, String>>()
    val domain = URL(url).host

    cookieString.split(";").forEach { cookie ->
      val trimmed = cookie.trim()
      val parts = trimmed.split("=", limit = 2)

      if (parts.size == 2) {
        val cookieName = parts[0].trim()
        val cookieValue = parts[1].trim()

        try {
          val decryptedValue = CookieCrypto.decrypt(cookieValue)

          cookies[cookieName] = mapOf(
            "name" to cookieName,
            "value" to decryptedValue,
            "domain" to domain,
            "path" to "/"
          )
        } catch (_: AEADBadTagException) {
          // Cookie adulterado - pular silenciosamente
        } catch (_: Exception) {
          // Erro de descriptografia - pular silenciosamente
        }
      }
    }

    return cookies
  }
}
