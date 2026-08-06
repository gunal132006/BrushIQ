package com.brushiq.automation.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class ReminderScreen extends BasePage {

    private final By headerTitle = byText("Clinical Reminders");
    private final By reminderCardItem = byTextContains("brushing");

    public ReminderScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(headerTitle, 10);
    }

    public boolean isReminderDisplayed() {
        return isElementPresent(reminderCardItem, 5);
    }
}
