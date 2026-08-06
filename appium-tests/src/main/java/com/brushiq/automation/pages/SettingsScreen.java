package com.brushiq.automation.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class SettingsScreen extends BasePage {

    private final By settingsHeader = byText("Settings");
    private final By backButton = accessibilityId("Back");
    private final By themeOption = byTextContains("Theme");
    private final By languageOption = byTextContains("Language");
    private final By notificationsOption = byTextContains("Notifications");
    private final By darkThemeOption = byText("Dark");
    private final By lightThemeOption = byText("Light");

    public SettingsScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(settingsHeader, 10);
    }

    public void clickBack() {
        click(backButton);
    }

    public void clickThemeOption() {
        click(themeOption);
    }

    public void selectDarkTheme() {
        clickThemeOption();
        click(darkThemeOption);
    }

    public void selectLightTheme() {
        clickThemeOption();
        click(lightThemeOption);
    }

    public void clickLanguageOption() {
        click(languageOption);
    }
}
