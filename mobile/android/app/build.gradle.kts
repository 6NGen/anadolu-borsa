import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // Firebase (FCM push) — google-services.json'u işler
    id("com.google.gms.google-services")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Play Store yükleme anahtarı: android/key.properties varsa onunla imzalanır
// (gitignore'da — ASLA commit'leme). Yoksa eskisi gibi debug anahtarı: yerel
// APK akışı bozulmaz. Kurulum: mobile/PLAY_STORE.md
val anahtarDosyasi = rootProject.file("key.properties")
val anahtar = Properties().apply { if (anahtarDosyasi.exists()) anahtarDosyasi.inputStream().use { load(it) } }

android {
    namespace = "com.anadoluborsa.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.anadoluborsa.mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (anahtarDosyasi.exists()) {
            create("yukleme") {
                keyAlias = anahtar.getProperty("keyAlias")
                keyPassword = anahtar.getProperty("keyPassword")
                storeFile = file(anahtar.getProperty("storeFile"))
                storePassword = anahtar.getProperty("storePassword")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (anahtarDosyasi.exists()) signingConfigs.getByName("yukleme")
                            else signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}
