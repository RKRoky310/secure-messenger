package com.securemessenger.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.securemessenger.data.local.entity.MessageEntity
import com.securemessenger.data.local.entity.UserEntity

/**
 * Room Database with SQLCipher encryption
 */
@Database(
    entities = [UserEntity::class, MessageEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class SecureMessengerDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun messageDao(): MessageDao

    companion object {
        @Volatile
        private var instance: SecureMessengerDatabase? = null

        fun getInstance(context: Context): SecureMessengerDatabase {
            return instance ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    SecureMessengerDatabase::class.java,
                    "secure_messenger.db"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { instance = it }
            }
        }
    }
}

interface UserDao {
    // User queries
}

interface MessageDao {
    // Message queries
}

class Converters {
    // Type converters for Room
}
