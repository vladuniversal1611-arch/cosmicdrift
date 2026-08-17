// Reference snippet — merge into your app module's build.gradle.kts.
// (Android Studio generates most of this; the parts that matter are the
//  compileSdk/minSdk and the two dependencies at the bottom.)

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.skydoku.game"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.skydoku.game"
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    // Google Mobile Ads (AdMob) — the only extra dependency the wrapper needs.
    implementation("com.google.android.gms:play-services-ads:23.6.0")
}
