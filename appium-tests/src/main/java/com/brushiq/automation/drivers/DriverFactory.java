package com.brushiq.automation.drivers;

import com.brushiq.automation.utils.ConfigReader;
import com.brushiq.automation.utils.LogUtils;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;

import java.net.URI;
import java.net.URL;
import java.time.Duration;

public class DriverFactory {

    public static AndroidDriver createDriver() {
        int maxRetries = ConfigReader.getIntProperty("driver.startup.max.retries", 3);
        int attempt = 0;
        Exception lastException = null;

        String serverUrlStr = ConfigReader.getProperty("appium.server.url", "http://127.0.0.1:4723");

        while (attempt < maxRetries) {
            attempt++;
            try {
                LogUtils.info("Initializing Appium AndroidDriver (Attempt " + attempt + " of " + maxRetries + ")...");
                URL serverUrl = URI.create(serverUrlStr).toURL();
                UiAutomator2Options options = DeviceConfig.getAndroidOptions();

                AndroidDriver driver = new AndroidDriver(serverUrl, options);
                int implicitWait = ConfigReader.getIntProperty("implicit.wait.seconds", 5);
                driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(implicitWait));

                LogUtils.info("Appium AndroidDriver initialized successfully on device: " + driver.getCapabilities().getCapability("deviceName"));
                return driver;
            } catch (Exception e) {
                lastException = e;
                LogUtils.warn("Appium driver startup failed on attempt " + attempt + ": " + e.getMessage());
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException ignored) {}
            }
        }
        throw new RuntimeException("Could not initialize Appium AndroidDriver after " + maxRetries + " attempts.", lastException);
    }
}
