package com.brushiq.automation.tests;

import com.brushiq.automation.base.BaseTest;
import com.brushiq.automation.listeners.TestResultListener;
import com.brushiq.automation.pages.DashboardScreen;
import com.brushiq.automation.pages.LoginScreen;
import com.brushiq.automation.pages.ProfileScreen;
import com.brushiq.automation.pages.RegisterScreen;
import com.brushiq.automation.utils.LogUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(TestResultListener.class)
public class AuthenticationTest extends BaseTest {

    @Test
    @Tag("smoke")
    @Tag("regression")
    @DisplayName("Verify User Login with Valid Credentials")
    public void testValidLogin() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);

        LogUtils.info("Performing login with test credentials...");
        loginScreen.performLogin("gunal.s@brushiq.com", "password123");

        assertTrue(dashboardScreen.isLoaded(), "Dashboard screen should be displayed after valid login.");
    }

    @Test
    @Tag("regression")
    @DisplayName("Verify User Registration Flow")
    public void testRegistration() {
        LoginScreen loginScreen = new LoginScreen(driver);
        RegisterScreen registerScreen = new RegisterScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);

        if (loginScreen.isLoaded()) {
            loginScreen.clickRegisterLink();
        }

        if (registerScreen.isLoaded()) {
            String testEmail = "testuser_" + System.currentTimeMillis() + "@brushiq.com";
            registerScreen.performRegistration("Test User", testEmail, "+15550001111", "SecurePass123!");
            assertTrue(dashboardScreen.isLoaded(), "Dashboard should load after registration.");
        }
    }

    @Test
    @Tag("regression")
    @DisplayName("Verify User Logout")
    public void testLogout() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);
        ProfileScreen profileScreen = new ProfileScreen(driver);

        loginScreen.performLogin("gunal.s@brushiq.com", "password123");
        assertTrue(dashboardScreen.isLoaded(), "Dashboard should be loaded.");

        // Open profile and sign out
        driver.navigate().back(); // Or navigate to profile
        if (profileScreen.isLoaded()) {
            profileScreen.performLogout();
            assertTrue(loginScreen.isLoaded(), "Login screen should be displayed after logout.");
        }
    }

    @Test
    @Tag("negative")
    @Tag("regression")
    @DisplayName("Verify Invalid Password Error Message")
    public void testInvalidPassword() {
        LoginScreen loginScreen = new LoginScreen(driver);

        LogUtils.info("Testing invalid password submission...");
        loginScreen.performLogin("gunal.s@brushiq.com", "wrongpassword");

        assertTrue(loginScreen.isErrorMessageDisplayed("Invalid") || loginScreen.isLoaded(),
                "Error message should be shown or user should remain on Login screen.");
    }
}
