package com.brushiq.automation.pages;

import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class HistoryScreen extends BasePage {

    private final By headerTitle = byText("Scan History");
    private final By searchField = AppiumBy.xpath("//android.widget.EditText");
    private final By allFilterTab = byText("All");
    private final By goodFilterTab = byText("Good");
    private final By replaceSoonFilterTab = byText("Replace Soon");
    private final By historyCardItem = AppiumBy.xpath("//*[contains(@text, 'Score:') or contains(@text, 'Wear') or contains(@text, 'Good') or contains(@text, 'Moderate')]");

    public HistoryScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(headerTitle, 10) || isElementPresent(allFilterTab, 10);
    }

    public void enterSearchQuery(String query) {
        type(searchField, query);
    }

    public void selectFilter(String filterName) {
        click(byText(filterName));
    }

    public boolean isHistoryItemDisplayed() {
        return isElementPresent(historyCardItem, 5);
    }

    public void clickFirstHistoryItem() {
        click(historyCardItem);
    }
}
