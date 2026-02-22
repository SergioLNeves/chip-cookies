package expo.modules.chipcookies

/**
 * Validação e sanitização de cookies conforme RFC 6265.
 *
 * - Names: token estrito (sem CTLs, separadores)
 * - Values: percent-encoding para chars inválidos (JWTs passam direto)
 * - Domain/Path/SameSite: validação básica
 */
object CookieValidator {

  private const val MAX_NAME_LENGTH = 256
  private const val MAX_VALUE_LENGTH = 4096

  // RFC 6265 token: qualquer CHAR exceto CTLs e separadores
  // Separadores: ( ) < > @ , ; : \ " / [ ] ? = { } SP HT
  private val INVALID_NAME_CHARS = Regex("[\\x00-\\x1f\\x7f \\t\"(),/:;<=>?@\\[\\\\\\]{}]")

  // CTLs (0x00-0x1F, 0x7F), semicolon e backslash são inválidos em cookie values
  private val INVALID_VALUE_CHARS = Regex("[\\x00-\\x1f\\x7f;\\\\]")

  /**
   * Valida nome de cookie contra regex de token RFC 6265.
   * @throws IllegalArgumentException se o nome é inválido
   */
  fun validateName(name: String): String {
    if (name.isEmpty()) {
      throw IllegalArgumentException("Cookie name cannot be empty")
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw IllegalArgumentException(
        "Cookie name exceeds maximum length of $MAX_NAME_LENGTH characters"
      )
    }
    if (INVALID_NAME_CHARS.containsMatchIn(name)) {
      throw IllegalArgumentException(
        "Cookie name '$name' contains invalid characters (CTLs or separators)"
      )
    }
    return name
  }

  /**
   * Sanitiza valor de cookie.
   * Chars inválidos (CTLs, semicolon, backslash) são percent-encoded.
   * Chars válidos passam inalterados — JWTs (Base64url) passam direto.
   */
  fun sanitizeValue(value: String): String {
    if (value.length > MAX_VALUE_LENGTH) {
      throw IllegalArgumentException(
        "Cookie value exceeds maximum length of $MAX_VALUE_LENGTH characters"
      )
    }
    if (!INVALID_VALUE_CHARS.containsMatchIn(value)) {
      return value
    }

    val sb = StringBuilder(value.length)
    for (char in value) {
      if (char.code in 0x00..0x1f || char.code == 0x7f || char == ';' || char == '\\') {
        sb.append("%%%02X".format(char.code))
      } else {
        sb.append(char)
      }
    }
    return sb.toString()
  }

  /**
   * Validação básica de domínio.
   * @throws IllegalArgumentException se o domínio é inválido
   */
  fun validateDomain(domain: String): String {
    if (domain.isEmpty()) {
      throw IllegalArgumentException("Cookie domain cannot be empty")
    }
    // Domínio não pode conter chars perigosos
    if (domain.contains(";") || domain.contains("\\") || domain.any { it.code < 0x20 }) {
      throw IllegalArgumentException("Cookie domain '$domain' contains invalid characters")
    }
    // Leading dot é permitido pela RFC 6265 (indica match de subdomínios)
    val normalized = domain.removePrefix(".")
    if (normalized.isEmpty()) {
      throw IllegalArgumentException("Cookie domain '$domain' cannot be only a dot")
    }
    if (normalized.endsWith(".")) {
      throw IllegalArgumentException("Cookie domain '$domain' cannot end with a dot")
    }
    if (normalized.contains("..")) {
      throw IllegalArgumentException("Cookie domain '$domain' contains consecutive dots")
    }
    return domain
  }

  /**
   * Valida path de cookie.
   * Deve começar com /, sem CTLs ou semicolons.
   * @throws IllegalArgumentException se o path é inválido
   */
  fun validatePath(path: String): String {
    if (!path.startsWith("/")) {
      throw IllegalArgumentException("Cookie path must start with '/', got '$path'")
    }
    if (path.contains(";") || path.any { it.code < 0x20 }) {
      throw IllegalArgumentException("Cookie path '$path' contains invalid characters")
    }
    return path
  }

  /**
   * Valida atributo Expires de cookie.
   * Rejeita valores com chars que poderiam causar injection (semicolon, CTLs).
   * @throws IllegalArgumentException se o valor contém caracteres inválidos
   */
  fun validateExpires(expires: String): String {
    if (expires.contains(";") || expires.any { it.code < 0x20 }) {
      throw IllegalArgumentException("Cookie expires contains invalid characters")
    }
    return expires
  }

  /**
   * Normaliza e valida atributo SameSite.
   * Aceita apenas Strict, Lax ou None (case-insensitive).
   * @throws IllegalArgumentException se o valor é inválido
   */
  fun validateSameSite(sameSite: String): String {
    return when (sameSite.lowercase()) {
      "strict" -> "Strict"
      "lax" -> "Lax"
      "none" -> "None"
      else -> throw IllegalArgumentException(
        "Invalid SameSite value '$sameSite'. Must be Strict, Lax, or None"
      )
    }
  }
}
