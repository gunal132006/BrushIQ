plugins {
    id("java")
}

group = "com.brushiq.automation"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // JUnit 5
    implementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
    implementation("org.junit.jupiter:junit-jupiter-params:5.10.2")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher:1.10.2")

    // Appium & Selenium
    implementation("io.appium:java-client:9.2.2")
    implementation("org.seleniumhq.selenium:selenium-java:4.21.0")

    // Extent Reports
    implementation("com.aventstack:extentreports:5.1.1")

    // Utilities & Logging
    implementation("com.fasterxml.jackson.core:jackson-databind:2.17.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.slf4j:slf4j-simple:2.0.13")
    implementation("commons-io:commons-io:2.16.1")
}

tasks.test {
    useJUnitPlatform {
        val suite = System.getProperty("suite") ?: "all"
        if (suite.equals("smoke", ignoreCase = true)) {
            includeTags("smoke")
        } else if (suite.equals("regression", ignoreCase = true)) {
            includeTags("regression")
        }
    }

    testLogging {
        events("passed", "skipped", "failed", "standardOut", "standardError")
        showExceptions = true
        showCauses = true
        showStackTraces = true
    }

    systemProperty("appium.server.url", System.getProperty("appium.server.url", "http://127.0.0.1:4723"))
    systemProperty("android.app.path", System.getProperty("android.app.path", ""))
    systemProperty("android.device.name", System.getProperty("android.device.name", "Android Emulator"))
    systemProperty("api.base.url", System.getProperty("api.base.url", "https://brushiq-backend.onrender.com/api"))
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
