package com.securemessenger.security

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import java.util.concurrent.Executor

/**
 * Manages biometric authentication
 */
class BiometricManager(private val context: Context) {
    /**
     * Check if biometric authentication is available
     */
    fun isBiometricAvailable(): Boolean {
        val biometricManager = BiometricManager.from(context)
        return when (biometricManager.canAuthenticate()) {
            BiometricManager.BIOMETRIC_SUCCESS -> true
            else -> false
        }
    }

    /**
     * Prompt user for biometric authentication
     */
    fun authenticate(
        activity: FragmentActivity,
        executor: Executor,
        onSuccess: () -> Unit,
        onError: (errorCode: Int, errString: CharSequence) -> Unit
    ) {
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock Secure Messenger")
            .setSubtitle("Use biometric authentication")
            .setNegativeButtonText("Cancel")
            .build()

        val biometricPrompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(
                    result: BiometricPrompt.AuthenticationResult
                ) {
                    super.onAuthenticationSucceeded(result)
                    onSuccess()
                }

                override fun onAuthenticationError(
                    errorCode: Int,
                    errString: CharSequence
                ) {
                    super.onAuthenticationError(errorCode, errString)
                    onError(errorCode, errString)
                }
            }
        )

        biometricPrompt.authenticate(promptInfo)
    }
}
