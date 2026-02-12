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

    // set(url, cookie) - Define um cookie
    AsyncFunction("set") { url: String, cookie: Map<String, Any>, promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()
        val domain = URL(url).host
        val cookieString = buildCookieString(cookie, domain)

        cookieManager.setCookie(url, cookieString)
        cookieManager.flush()

        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("ERR_SET", e.message, e)
      }
    }

    // get(url) - Recupera cookies
    AsyncFunction("get") { url: String, promise: Promise ->
      try {
        val cookieManager = CookieManager.getInstance()
        val cookieString = cookieManager.getCookie(url)

        val cookies = if (cookieString != null) {
          parseCookies(cookieString, url)
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

    // flush() - Força persistência
    Function("flush") {
      CookieManager.getInstance().flush()
      true
    }
  }

  /**
   * Constrói string de cookie no formato Set-Cookie RFC 6265
   */
  private fun buildCookieString(cookie: Map<String, Any>, domain: String): String {
    val name = cookie["name"] as String
    val value = cookie["value"] as String
    val parts = mutableListOf("$name=$value")

    // Domain
    val cookieDomain = cookie["domain"] as? String ?: domain
    parts.add("Domain=$cookieDomain")

    // Path
    val path = cookie["path"] as? String ?: "/"
    parts.add("Path=$path")

    // Expires
    (cookie["expires"] as? String)?.let { parts.add("Expires=$it") }

    // Max-Age
    (cookie["maxAge"] as? Number)?.let { parts.add("Max-Age=$it") }

    // Secure
    if (cookie["secure"] as? Boolean == true) {
      parts.add("Secure")
    }

    // HttpOnly
    if (cookie["httpOnly"] as? Boolean == true) {
      parts.add("HttpOnly")
    }

    // SameSite
    (cookie["sameSite"] as? String)?.let { parts.add("SameSite=$it") }

    return parts.joinToString("; ")
  }

  /**
   * Parse string de cookies do CookieManager
   */
  private fun parseCookies(cookieString: String, url: String): Map<String, Map<String, String>> {
    val cookies = mutableMapOf<String, Map<String, String>>()
    val domain = URL(url).host

    cookieString.split(";").forEach { cookie ->
      val trimmed = cookie.trim()
      val parts = trimmed.split("=", limit = 2)

      if (parts.size == 2) {
        val cookieName = parts[0]
        val cookieValue = parts[1]

        cookies[cookieName] = mapOf(
          "name" to cookieName,
          "value" to cookieValue,
          "domain" to domain,
          "path" to "/"
        )
      }
    }

    return cookies
  }
}
