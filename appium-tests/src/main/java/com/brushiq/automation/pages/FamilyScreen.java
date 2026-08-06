package com.brushiq.automation.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class FamilyScreen extends BasePage {

    private final By headerTitle = byText("Family Profiles");
    private final By addMemberButton = accessibilityId("Add Member");

    public FamilyScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(headerTitle, 10);
    }

    public void clickAddMember() {
        click(addMemberButton);
    }
}
