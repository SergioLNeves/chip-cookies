package expo.modules.chipcookies

import android.util.Log
import java.net.URL
import javax.crypto.AEADBadTagException

/**
 * Serialização e parsing de cookies conforme RFC 6265.
 *
 * - buildCookieString: monta Set-Cookie header com validação e criptografia
 * - parseCookiesWithDecryption: converte cookie string em mapa descriptografado
 */
object CookieSerializer {

  /**
   * Constrói string de cookie no formato Set-Cookie RFC 6265.
   * Aplica validação em todos os campos e criptografia no valor.
   * Secure é forçado sempre como true.
   *
   * @throws IllegalArgumentException se name/value são inválidos
   * @throws java.security.GeneralSecurityException se a criptografia falhar
   */
  fun buildCookieString(cookie: Map<String, Any>, domain: String): String {
    val name = CookieValidator.validateName(
      (cookie["name"] as? String)
        ?: throw IllegalArgumentException("Cookie 'name' is required and must be a string")
    )
    val rawValue = (cookie["value"] as? String)
      ?: throw IllegalArgumentException("Cookie 'value' is required and must be a string")
    val sanitizedValue = CookieValidator.sanitizeValue(rawValue)
    val encryptedValue = CookieCrypto.encrypt(sanitizedValue)
    val parts = mutableListOf("$name=$encryptedValue")

    // Domain (validado)
    val cookieDomain = cookie["domain"] as? String ?: domain
    parts.add("Domain=${CookieValidator.validateDomain(cookieDomain)}")

    // Path (validado)
    val path = cookie["path"] as? String ?: "/"
    parts.add("Path=${CookieValidator.validatePath(path)}")

    // Expires (validado)
    (cookie["expires"] as? String)?.let {
      parts.add("Expires=${CookieValidator.validateExpires(it)}")
    }

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
  fun parseCookiesWithDecryption(
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
        } catch (e: AEADBadTagException) {
          Log.w("ExpoChipCookies", "Cookie '$cookieName' rejected: tampered or corrupted")
        } catch (e: Exception) {
          Log.w("ExpoChipCookies", "Cookie '$cookieName' decryption failed: ${e.javaClass.simpleName}")
        }
      }
    }

    return cookies
  }
}
