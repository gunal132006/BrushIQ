package com.brushiq.automation.listeners;

import com.brushiq.automation.drivers.DriverManager;
import com.brushiq.automation.utils.ExtentReportManager;
import com.brushiq.automation.utils.LogUtils;
import com.brushiq.automation.utils.ScreenshotUtils;
import io.appium.java_client.android.AndroidDriver;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestWatcher;

import java.util.Optional;

public class TestResultListener implements TestWatcher {

    @Override
    public void testSuccessful(ExtensionContext context) {
        String testName = context.getDisplayName();
        LogUtils.info("✔ TEST PASSED: " + testName);
        ExtentReportManager.logPass("Test passed successfully.");
    }

    @Override
    public void testFailed(ExtensionContext context, Throwable cause) {
        String testName = context.getDisplayName();
        LogUtils.error("✖ TEST FAILED: " + testName + " Reason: " + cause.getMessage(), cause);

        if (DriverManager.isDriverActive()) {
            AndroidDriver driver = DriverManager.getDriver();
            String screenshotPath = ScreenshotUtils.captureScreenshot(driver, testName.replaceAll("[^a-zA-Z0-9_-]", "_"));
            ExtentReportManager.logFailWithScreenshot("Test failed: " + cause.getMessage(), screenshotPath);
        } else {
            ExtentReportManager.logFail("Test failed: " + cause.getMessage());
        }
    }

    @Override
    public void testDisabled(ExtensionContext context, Optional<String> reason) {
        String testName = context.getDisplayName();
        LogUtils.warn("⏸ TEST SKIPPED: " + testName + " Reason: " + reason.orElse("No reason provided"));
        ExtentReportManager.logWarning("Test skipped: " + reason.orElse("No reason provided"));
    }

    @Override
    public void testAborted(ExtensionContext context, Throwable cause) {
        String testName = context.getDisplayName();
        LogUtils.warn("⚠ TEST ABORTED: " + testName + " Reason: " + cause.getMessage());
        ExtentReportManager.logWarning("Test aborted: " + cause.getMessage());
    }
}
