package com.brushiq.automation.pages;

import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class ProfileScreen extends BasePage {

    private final By profileHeader = byText("My Profile");
    private final By settingsIcon = accessibilityId("Settings");
    private final By signOutButton = byText("SIGN OUT");
    private final By confirmSignOutButton = AppiumBy.xpath("//android.widget.Button[contains(@text, 'SIGN OUT')]");
    private final By cancelSignOutButton = byText("CANCEL");
    private final By totalScansStat = byTextContains("Total Scans");
    private final By fullNameLabel = byTextContains("Full Name");

    public ProfileScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(profileHeader, 10);
    }

    public boolean isUserNameDisplayed(String name) {
        return isElementPresent(byTextContains(name), 5);
    }

    public void clickSettings() {
        click(settingsIcon);
    }

    public void clickSignOut() {
        click(signOutButton);
    }

    public void confirmSignOut() {
        click(confirmSignOutButton);
    }

    public void cancelSignOut() {
        click(cancelSignOutButton);
    }

    public void performLogout() {
        clickSignOut();
        confirmSignOut();
    }
}
