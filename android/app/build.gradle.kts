plugins {
    id("com.android.application")
}

android {
    namespace = "app.metrika.solo"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.metrika.solo"
        minSdk = 23
        targetSdk = 35
        versionCode = 5
        versionName = "1.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
