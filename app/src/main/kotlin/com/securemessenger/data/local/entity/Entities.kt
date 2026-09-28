package com.securemessenger.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val username: String,
    val identityKey: ByteArray,
    val createdAt: Long
)

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String,
    val from: String,
    val to: String,
    val ciphertext: ByteArray,
    val nonce: ByteArray,
    val timestamp: Long,
    val isRead: Boolean = false
)
