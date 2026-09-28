package com.securemessenger.data.remote

import com.securemessenger.data.model.MessageDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface SecureMessengerApi {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): RegisterResponse

    @POST("messages")
    suspend fun sendMessage(@Body message: MessageDto): MessageDto

    @GET("messages")
    suspend fun getMessages(): List<MessageDto>

    @POST("auth/verify-device")
    suspend fun verifyDevice(@Body request: VerifyDeviceRequest): VerifyDeviceResponse
}

data class RegisterRequest(
    val username: String,
    val identityKey: ByteArray
)

data class RegisterResponse(
    val token: String,
    val userId: String
)

data class VerifyDeviceRequest(
    val deviceId: String,
    val fingerprint: String
)

data class VerifyDeviceResponse(
    val verified: Boolean
)
