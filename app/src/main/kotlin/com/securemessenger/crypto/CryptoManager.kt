package com.securemessenger.crypto

import com.google.crypto.tink.Aead
import com.google.crypto.tink.Tink
import com.google.crypto.tink.integration.gcpkms.GcpKmsClient
import com.google.crypto.tink.keyderivation.KeyDerivationConfig

/**
 * Handles encryption and decryption using Tink
 */
class CryptoManager {
    private val aead: Aead

    init {
        // Initialize Tink configuration
        KeyDerivationConfig.register()
        aead = Tink.getPrimitiveRegistry()
            .createPrimitive("type.googleapis.com/google.crypto.tink.AesGcmKey", Aead::class.java)
    }

    /**
     * Encrypt message with authenticated encryption
     */
    fun encryptMessage(
        plaintext: String,
        associatedData: String = ""
    ): ByteArray {
        val plaintextBytes = plaintext.toByteArray(Charsets.UTF_8)
        val associatedDataBytes = associatedData.toByteArray(Charsets.UTF_8)
        return aead.encrypt(plaintextBytes, associatedDataBytes)
    }

    /**
     * Decrypt message
     */
    fun decryptMessage(
        ciphertext: ByteArray,
        associatedData: String = ""
    ): String {
        val associatedDataBytes = associatedData.toByteArray(Charsets.UTF_8)
        val plaintextBytes = aead.decrypt(ciphertext, associatedDataBytes)
        return String(plaintextBytes, Charsets.UTF_8)
    }
}
