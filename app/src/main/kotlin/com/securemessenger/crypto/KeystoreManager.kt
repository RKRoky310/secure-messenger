package com.securemessenger.crypto

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.KeyGenerator

/**
 * Manages cryptographic keys stored in Android Keystore
 */
class KeystoreManager {
    private val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

    /**
     * Generate or retrieve identity key pair
     */
    fun getOrGenerateIdentityKey(userId: String): String {
        val keyAlias = "identity_key_$userId"

        return if (keyStore.containsAlias(keyAlias)) {
            keyAlias
        } else {
            generateIdentityKey(keyAlias)
        }
    }

    /**
     * Generate identity key in Android Keystore
     */
    private fun generateIdentityKey(keyAlias: String): String {
        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_EC,
            "AndroidKeyStore"
        )

        val keySpec = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        )
            .setDigests(KeyProperties.DIGEST_SHA256)
            .setUserAuthenticationRequired(true)
            .setUserAuthenticationValidityDurationSeconds(300)
            .setIsStrongBoxBacked(true)
            .build()

        keyGenerator.init(keySpec)
        keyGenerator.generateKeyPair()

        return keyAlias
    }

    /**
     * Get private key from keystore
     */
    fun getPrivateKey(keyAlias: String) = keyStore.getKey(keyAlias, null)

    /**
     * Get public key from keystore
     */
    fun getPublicKey(keyAlias: String) = keyStore.getCertificate(keyAlias)?.publicKey

    /**
     * Delete key from keystore
     */
    fun deleteKey(keyAlias: String) {
        keyStore.deleteEntry(keyAlias)
    }
}
