package com.brushiq.automation.tests;

import com.brushiq.automation.base.BaseTest;
import com.brushiq.automation.listeners.TestResultListener;
import com.brushiq.automation.pages.DashboardScreen;
import com.brushiq.automation.pages.LoginScreen;
import com.brushiq.automation.pages.NavigationComponent;
import com.brushiq.automation.pages.SettingsScreen;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(TestResultListener.class)
public class SettingsTest extends BaseTest {

    @Test
    @Tag("regression")
    @DisplayName("Verify Settings Screen Navigation and Options")
    public void testSettingsScreen() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);
        NavigationComponent nav = new NavigationComponent(driver);
        SettingsScreen settingsScreen = new SettingsScreen(driver);

        loginScreen.performLogin("gunal.s@brushiq.com", "password123");
        if (dashboardScreen.isLoaded()) {
            nav.navigateToSettings();
            assertTrue(settingsScreen.isLoaded(), "Settings screen should be displayed.");
        }
    }
}
