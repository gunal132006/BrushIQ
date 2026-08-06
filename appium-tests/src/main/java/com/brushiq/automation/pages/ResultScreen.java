package com.brushiq.automation.pages;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class ResultScreen extends BasePage {

    private final By reportHeader = byText("Diagnostic Report");
    private final By closeButton = accessibilityId("Close");
    private final By healthScore = byTextContains("%");
    private final By doneButton = byTextContains("DONE");

    public ResultScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(reportHeader, 15) || isElementPresent(healthScore, 15);
    }

    public void clickClose() {
        click(closeButton);
    }

    public void clickDone() {
        click(doneButton);
    }
}
