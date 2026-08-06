package com.brushiq.automation.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class NavigationComponent extends BasePage {

    private final By homeTab = accessibilityId("Home");
    private final By familyTab = accessibilityId("Family");
    private final By scanTab = accessibilityId("Scan");
    private final By historyTab = accessibilityId("History");
    private final By settingsTab = accessibilityId("Settings");

    public NavigationComponent(AndroidDriver driver) {
        super(driver);
    }

    public void navigateToHome() {
        click(homeTab);
    }

    public void navigateToFamily() {
        click(familyTab);
    }

    public void navigateToScan() {
        click(scanTab);
    }

    public void navigateToHistory() {
        click(historyTab);
    }

    public void navigateToSettings() {
        click(settingsTab);
    }

    public boolean isNavigationBarDisplayed() {
        return isElementPresent(homeTab, 10);
    }
}
