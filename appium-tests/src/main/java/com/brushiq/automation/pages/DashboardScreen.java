package com.brushiq.automation.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class DashboardScreen extends BasePage {

    private final By headerTitle = byText("BrushIQ");
    private final By notificationsIcon = accessibilityId("Notifications");
    private final By startScanButton = byTextContains("Start");
    private final By registerBrushButton = byTextContains("Register");
    private final By healthScoreCard = byTextContains("Health Score");

    public DashboardScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(headerTitle, 15) || isElementPresent(startScanButton, 15);
    }

    public boolean isUserGreetingDisplayed(String userName) {
        return isElementPresent(byTextContains(userName), 10);
    }

    public boolean isHealthScoreDisplayed() {
        return isElementPresent(healthScoreCard, 10);
    }

    public void clickStartNewScan() {
        click(startScanButton);
    }

    public void clickRegisterBrush() {
        click(registerBrushButton);
    }

    public void clickNotifications() {
        click(notificationsIcon);
    }
}
