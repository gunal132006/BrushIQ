package com.brushiq.automation.drivers;

import com.brushiq.automation.utils.LogUtils;
import io.appium.java_client.android.AndroidDriver;

public class DriverManager {
    private static final ThreadLocal<AndroidDriver> driverThreadLocal = new ThreadLocal<>();

    public static AndroidDriver getDriver() {
        if (driverThreadLocal.get() == null) {
            AndroidDriver driver = DriverFactory.createDriver();
            driverThreadLocal.set(driver);
        }
        return driverThreadLocal.get();
    }

    public static void quitDriver() {
        AndroidDriver driver = driverThreadLocal.get();
        if (driver != null) {
            try {
                LogUtils.info("Terminating Appium AndroidDriver...");
                driver.quit();
            } catch (Exception e) {
                LogUtils.warn("Error during Appium driver quit: " + e.getMessage());
            } finally {
                driverThreadLocal.remove();
            }
        }
    }

    public static boolean isDriverActive() {
        return driverThreadLocal.get() != null;
    }
}
