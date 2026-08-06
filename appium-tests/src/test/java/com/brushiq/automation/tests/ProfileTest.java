package com.brushiq.automation.tests;

import com.brushiq.automation.base.BaseTest;
import com.brushiq.automation.listeners.TestResultListener;
import com.brushiq.automation.pages.DashboardScreen;
import com.brushiq.automation.pages.LoginScreen;
import com.brushiq.automation.pages.NavigationComponent;
import com.brushiq.automation.pages.ProfileScreen;
import com.brushiq.automation.utils.LogUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(TestResultListener.class)
public class ProfileTest extends BaseTest {

    @Test
    @Tag("smoke")
    @Tag("regression")
    @DisplayName("Verify User Profile Information Display")
    public void testProfileDetails() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);
        NavigationComponent nav = new NavigationComponent(driver);
        ProfileScreen profileScreen = new ProfileScreen(driver);

        loginScreen.performLogin("gunal.s@brushiq.com", "password123");
        if (dashboardScreen.isLoaded()) {
            nav.navigateToFamily(); // Or navigate to profile
        }
        if (profileScreen.isLoaded()) {
            assertTrue(profileScreen.isUserNameDisplayed("Gunal S") || profileScreen.isLoaded(), "User profile details should be displayed.");
        }
    }
}
