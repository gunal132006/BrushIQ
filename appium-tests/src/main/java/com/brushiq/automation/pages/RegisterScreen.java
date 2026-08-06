package com.brushiq.automation.pages;

import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class RegisterScreen extends BasePage {

    private final By fullNameInput = AppiumBy.xpath("//*[contains(@text, 'Full Name')]/following-sibling::android.widget.EditText | //android.widget.EditText[1]");
    private final By emailInput = AppiumBy.xpath("//*[contains(@text, 'Email Address')]/following-sibling::android.widget.EditText | //android.widget.EditText[2]");
    private final By phoneInput = AppiumBy.xpath("//*[contains(@text, 'Phone Number')]/following-sibling::android.widget.EditText | //android.widget.EditText[3]");
    private final By passwordInput = AppiumBy.xpath("//*[contains(@text, 'Password') and not(contains(@text, 'Confirm'))]/following-sibling::android.widget.EditText | //android.widget.EditText[4]");
    private final By confirmPasswordInput = AppiumBy.xpath("//*[contains(@text, 'Confirm Password')]/following-sibling::android.widget.EditText | //android.widget.EditText[5]");
    private final By createAccountButton = byTextContains("CREATE ACCOUNT");
    private final By headerTitle = byText("Create Account");

    public RegisterScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(headerTitle, 10);
    }

    public void enterFullName(String fullName) {
        type(fullNameInput, fullName);
    }

    public void enterEmail(String email) {
        type(emailInput, email);
    }

    public void enterPhone(String phone) {
        type(phoneInput, phone);
    }

    public void enterPassword(String password) {
        type(passwordInput, password);
    }

    public void enterConfirmPassword(String confirmPassword) {
        type(confirmPasswordInput, confirmPassword);
    }

    public void clickCreateAccount() {
        click(createAccountButton);
    }

    public void performRegistration(String fullName, String email, String phone, String password) {
        enterFullName(fullName);
        enterEmail(email);
        enterPhone(phone);
        enterPassword(password);
        enterConfirmPassword(password);
        clickCreateAccount();
    }
}
