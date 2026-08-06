package com.brushiq.automation.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class ToothbrushScreen extends BasePage {

    private final By headerTitle = byText("My Toothbrushes");
    private final By addToothbrushButton = accessibilityId("Add Toothbrush");
    private final By editButton = accessibilityId("Edit");
    private final By deleteButton = accessibilityId("Delete");

    public ToothbrushScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(headerTitle, 10);
    }

    public void clickAddToothbrush() {
        click(addToothbrushButton);
    }

    public void clickEditFirstToothbrush() {
        click(editButton);
    }

    public void clickDeleteFirstToothbrush() {
        click(deleteButton);
    }
}
