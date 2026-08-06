package com.brushiq.automation.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class SplashScreen extends BasePage {

    private final By titleText = byTextContains("BrushIQ");
    private final By retryButton = byText("Retry Connection");

    public SplashScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(titleText, 5);
    }

    public boolean isServerUnreachable() {
        return isElementPresent(retryButton, 5);
    }

    public void clickRetryIfPresent() {
        if (isServerUnreachable()) {
            click(retryButton);
        }
    }
}
