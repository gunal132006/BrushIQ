package com.brushiq.automation.pages;

import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class ScanScreen extends BasePage {

    private final By scanHeader = byTextContains("Scan");
    private final By captureButton = AppiumBy.xpath("//android.widget.IconButton | //*[contains(@content-desc, 'Capture') or contains(@content-desc, 'Scan')]");
    private final By galleryButton = AppiumBy.xpath("//*[contains(@content-desc, 'Gallery') or contains(@content-desc, 'Photo')]");
    private final By flashButton = AppiumBy.xpath("//*[contains(@content-desc, 'Flash')]");

    public ScanScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(scanHeader, 10) || isElementPresent(captureButton, 10);
    }

    public void clickCapture() {
        click(captureButton);
    }

    public void clickGallery() {
        click(galleryButton);
    }

    public void clickFlash() {
        click(flashButton);
    }
}
