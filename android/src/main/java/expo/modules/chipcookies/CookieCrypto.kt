package expo.modules.chipcookies

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Criptografia transparente de cookies via Android Keystore.
 *
 * Usa AES-256-GCM com chave protegida por hardware (TEE/StrongBox).
 * A chave nunca sai do Keystore — o módulo só conhece o alias.
 *
 * Formato armazenado: "cc_enc_v1:" + Base64(IV_12bytes + ciphertext + GCM_tag_16bytes)
 */
object CookieCrypto {

  private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
  private const val KEY_ALIAS = "chip_cookies_master_key"
  private const val TRANSFORMATION = "AES/GCM/NoPadding"
  private const val PREFIX = "cc_enc_v1:"
  private const val GCM_IV_LENGTH = 12
  private const val GCM_TAG_LENGTH = 128 // bits

  /**
   * Recupera ou cria a chave AES-256 no Android Keystore.
   */
  private fun getOrCreateKey(): SecretKey {
    val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
    keyStore.load(null)

    val existingKey = keyStore.getEntry(KEY_ALIAS, null)
    if (existingKey is KeyStore.SecretKeyEntry) {
      return existingKey.secretKey
    }

    val keyGenerator = KeyGenerator.getInstance(
      KeyProperties.KEY_ALGORITHM_AES,
      KEYSTORE_PROVIDER
    )

    val spec = KeyGenParameterSpec.Builder(
      KEY_ALIAS,
      KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
    )
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setKeySize(256)
      .setRandomizedEncryptionRequired(true)
      .build()

    keyGenerator.init(spec)
    return keyGenerator.generateKey()
  }

  /**
   * Criptografa um valor plaintext.
   * @return String no formato "cc_enc_v1:" + Base64(IV + ciphertext + tag)
   */
  fun encrypt(plaintext: String): String {
    val key = getOrCreateKey()
    val cipher = Cipher.getInstance(TRANSFORMATION)
    cipher.init(Cipher.ENCRYPT_MODE, key)

    val iv = cipher.iv // 12 bytes gerados automaticamente
    val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))

    // IV + ciphertext (que já inclui GCM tag no final)
    val combined = ByteArray(iv.size + ciphertext.size)
    System.arraycopy(iv, 0, combined, 0, iv.size)
    System.arraycopy(ciphertext, 0, combined, iv.size, ciphertext.size)

    return PREFIX + Base64.encodeToString(combined, Base64.NO_WRAP)
  }

  /**
   * Descriptografa um valor armazenado.
   * Se o valor não tem o prefixo cc_enc_v1:, retorna como está (suporte a migração).
   * @throws javax.crypto.AEADBadTagException se o valor foi adulterado
   */
  fun decrypt(stored: String): String {
    if (!isEncrypted(stored)) {
      return stored
    }

    val encoded = stored.removePrefix(PREFIX)
    val combined = Base64.decode(encoded, Base64.NO_WRAP)

    val iv = combined.copyOfRange(0, GCM_IV_LENGTH)
    val ciphertext = combined.copyOfRange(GCM_IV_LENGTH, combined.size)

    val key = getOrCreateKey()
    val cipher = Cipher.getInstance(TRANSFORMATION)
    val spec = GCMParameterSpec(GCM_TAG_LENGTH, iv)
    cipher.init(Cipher.DECRYPT_MODE, key, spec)

    val plaintext = cipher.doFinal(ciphertext)
    return String(plaintext, Charsets.UTF_8)
  }

  /**
   * Verifica se um valor está criptografado (tem o prefixo versionado).
   */
  fun isEncrypted(value: String): Boolean {
    return value.startsWith(PREFIX)
  }

  /**
   * Deleta a chave do Keystore (para reset/rotação de chave).
   */
  fun deleteKey() {
    val keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER)
    keyStore.load(null)
    if (keyStore.containsAlias(KEY_ALIAS)) {
      keyStore.deleteEntry(KEY_ALIAS)
    }
  }
}
