package com.brushiq.automation.pages;

import com.brushiq.automation.utils.ConfigReader;
import com.brushiq.automation.utils.LogUtils;
import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

public abstract class BasePage {

    protected AndroidDriver driver;
    protected int defaultTimeout;

    public BasePage(AndroidDriver driver) {
        this.driver = driver;
        this.defaultTimeout = ConfigReader.getIntProperty("explicit.wait.seconds", 15);
    }

    protected WebElement waitForElement(By locator) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(defaultTimeout));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitForElement(By locator, int timeoutSeconds) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds));
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected boolean isElementPresent(By locator) {
        try {
            return driver.findElements(locator).size() > 0 && driver.findElement(locator).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    protected boolean isElementPresent(By locator, int timeoutSeconds) {
        try {
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds));
            return wait.until(ExpectedConditions.visibilityOfElementLocated(locator)).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    protected void click(By locator) {
        LogUtils.info("Clicking element: " + locator);
        waitForElement(locator).click();
    }

    protected void type(By locator, String text) {
        LogUtils.info("Typing text into " + locator + ": " + text);
        WebElement el = waitForElement(locator);
        el.clear();
        el.sendKeys(text);
    }

    protected String getText(By locator) {
        return waitForElement(locator).getText();
    }

    protected By accessibilityId(String id) {
        return AppiumBy.accessibilityId(id);
    }

    protected By byText(String text) {
        return AppiumBy.xpath("//*[@text='" + text + "' or @content-desc='" + text + "']");
    }

    protected By byTextContains(String substring) {
        return AppiumBy.xpath("//*[contains(@text, '" + substring + "') or contains(@content-desc, '" + substring + "')]");
    }

    protected By resourceId(String id) {
        return AppiumBy.id(id);
    }
}
