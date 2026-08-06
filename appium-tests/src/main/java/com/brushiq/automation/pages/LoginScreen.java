package com.brushiq.automation.pages;

import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;

public class LoginScreen extends BasePage {

    private final By emailInput = AppiumBy.xpath("//*[contains(@text, 'Email') or contains(@text, 'Credentials')]/following-sibling::android.widget.EditText | //android.widget.EditText[1]");
    private final By passwordInput = AppiumBy.xpath("//*[contains(@text, 'Password')]/following-sibling::android.widget.EditText | //android.widget.EditText[2]");
    private final By signInButton = byTextContains("SIGN IN");
    private final By registerLink = byTextContains("Sign Up");
    private final By forgotPasswordLink = byTextContains("Forgot Password?");
    private final By welcomeHeader = byText("Welcome Back");

    public LoginScreen(AndroidDriver driver) {
        super(driver);
    }

    public boolean isLoaded() {
        return isElementPresent(welcomeHeader, 10) || isElementPresent(signInButton, 10);
    }

    public void enterEmailOrPhone(String email) {
        type(emailInput, email);
    }

    public void enterPassword(String password) {
        type(passwordInput, password);
    }

    public void clickSignIn() {
        click(signInButton);
    }

    public void performLogin(String username, String password) {
        enterEmailOrPhone(username);
        enterPassword(password);
        clickSignIn();
    }

    public void clickRegisterLink() {
        click(registerLink);
    }

    public void clickForgotPasswordLink() {
        click(forgotPasswordLink);
    }

    public boolean isErrorMessageDisplayed(String expectedErrorText) {
        return isElementPresent(byTextContains(expectedErrorText), 5);
    }
}
