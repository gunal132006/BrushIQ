package com.brushiq.automation.base;

import com.brushiq.automation.drivers.DriverManager;
import com.brushiq.automation.utils.ConfigReader;
import com.brushiq.automation.utils.ExtentReportManager;
import com.brushiq.automation.utils.LogUtils;
import com.brushiq.automation.utils.ScreenshotUtils;
import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInfo;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public abstract class BaseTest {

    protected AndroidDriver driver;

    @BeforeEach
    public void setUp(TestInfo testInfo) {
        String testName = testInfo.getDisplayName();
        LogUtils.info("=== Starting Test: " + testName + " ===");
        ExtentReportManager.createTest(testName, testInfo.getTestMethod().map(m -> m.getName()).orElse("Appium Test"));
        
        try {
            driver = DriverManager.getDriver();
        } catch (Exception e) {
            LogUtils.error("Failed to initialize driver in BaseTest: " + e.getMessage(), e);
            throw e;
        }
    }

    @AfterEach
    public void tearDown(TestInfo testInfo) {
        String testName = testInfo.getDisplayName();
        try {
            if (driver != null) {
                LogUtils.info("Finished Test: " + testName);
            }
        } catch (Exception e) {
            LogUtils.warn("Error during tearDown: " + e.getMessage());
        } finally {
            DriverManager.quitDriver();
            ExtentReportManager.flush();
        }
    }

    public WebElement waitForVisibility(By locator, int timeoutSeconds) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public WebElement waitForVisibility(By locator) {
        int timeout = ConfigReader.getIntProperty("explicit.wait.seconds", 15);
        return waitForVisibility(locator, timeout);
    }

    public boolean isElementDisplayed(By locator) {
        try {
            return driver.findElement(locator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void clickElement(By locator) {
        waitForVisibility(locator).click();
    }

    public void enterText(By locator, String text) {
        WebElement el = waitForVisibility(locator);
        el.clear();
        el.sendKeys(text);
    }

    public String getElementText(By locator) {
        return waitForVisibility(locator).getText();
    }

    public void captureFailureScreenshot(String testName) {
        if (driver != null) {
            String path = ScreenshotUtils.captureScreenshot(driver, testName);
            ExtentReportManager.logFailWithScreenshot("Test Failed: " + testName, path);
        }
    }
}
