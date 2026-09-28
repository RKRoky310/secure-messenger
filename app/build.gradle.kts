plugins {
    id 'com.android.application'
    id 'kotlin-android'
    id 'kotlin-kapt'
    id 'dagger.hilt.android.plugin'
}

android {
    namespace "com.securemessenger"
    compileSdk 34

    defaultConfig {
        applicationId "com.securemessenger"
        minSdk 31
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary true
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose true
    }

    composeOptions {
        kotlinCompilerExtensionVersion "1.5.3"
    }
}

dependencies {
    // Core
    implementation "androidx.core:core-ktx:1.12.0"
    implementation "androidx.appcompat:appcompat:1.6.1"
    implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.6.2"

    // Compose
    implementation "androidx.activity:activity-compose:1.8.1"
    implementation "androidx.compose.ui:ui:1.5.4"
    implementation "androidx.compose.ui:ui-graphics:1.5.4"
    implementation "androidx.compose.ui:ui-tooling-preview:1.5.4"
    implementation "androidx.compose.material3:material3:1.1.2"
    implementation "androidx.navigation:navigation-compose:2.7.5"

    // Cryptography
    implementation "com.google.crypto.tink:tink-android:1.10.0"
    implementation "org.signal:libsignal-android:0.31.0"
    implementation "androidx.security:security-crypto:1.1.0-alpha06"

    // Database
    implementation "androidx.room:room-runtime:2.6.1"
    implementation "androidx.room:room-ktx:2.6.1"
    implementation "net.zetetic:android-database-sqlcipher:4.5.4"
    kapt "androidx.room:room-compiler:2.6.1"

    // Networking
    implementation "com.squareup.okhttp3:okhttp:4.11.0"
    implementation "com.squareup.retrofit2:retrofit:2.9.0"
    implementation "com.squareup.retrofit2:converter-kotlinx-serialization:2.9.0"
    implementation "org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0"
    implementation "com.google.net.cronet:cronet-okhttpfactory:0.1.0"

    // Async
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3"

    // Dependency Injection
    implementation "com.google.dagger:hilt-android:2.48"
    kapt "com.google.dagger:hilt-compiler:2.48"
    implementation "androidx.hilt:hilt-navigation-compose:1.1.0"

    // Biometric
    implementation "androidx.biometric:biometric:1.1.0"

    // QR Code
    implementation "com.google.mlkit:barcode-scanning:17.0.0"

    // Testing
    testImplementation "junit:junit:4.13.2"
    androidTestImplementation "androidx.test.ext:junit:1.1.5"
    androidTestImplementation "androidx.test.espresso:espresso-core:3.5.1"
    androidTestImplementation "androidx.compose.ui:ui-test-junit4:1.5.4"
}
