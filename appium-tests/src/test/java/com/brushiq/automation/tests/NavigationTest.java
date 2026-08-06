package com.brushiq.automation.tests;

import com.brushiq.automation.base.BaseTest;
import com.brushiq.automation.listeners.TestResultListener;
import com.brushiq.automation.pages.DashboardScreen;
import com.brushiq.automation.pages.FamilyScreen;
import com.brushiq.automation.pages.HistoryScreen;
import com.brushiq.automation.pages.LoginScreen;
import com.brushiq.automation.pages.NavigationComponent;
import com.brushiq.automation.pages.ScanScreen;
import com.brushiq.automation.pages.SettingsScreen;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(TestResultListener.class)
public class NavigationTest extends BaseTest {

    @Test
    @Tag("smoke")
    @Tag("regression")
    @DisplayName("Verify Bottom Navigation Tabs Bar")
    public void testBottomNavigation() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);
        NavigationComponent nav = new NavigationComponent(driver);
        FamilyScreen familyScreen = new FamilyScreen(driver);
        ScanScreen scanScreen = new ScanScreen(driver);
        HistoryScreen historyScreen = new HistoryScreen(driver);
        SettingsScreen settingsScreen = new SettingsScreen(driver);

        loginScreen.performLogin("gunal.s@brushiq.com", "password123");
        assertTrue(dashboardScreen.isLoaded(), "Dashboard screen should be loaded.");

        nav.navigateToFamily();
        assertTrue(familyScreen.isLoaded(), "Family screen should load after clicking Family tab.");

        nav.navigateToScan();
        assertTrue(scanScreen.isLoaded(), "Scan screen should load after clicking Scan tab.");

        nav.navigateToHistory();
        assertTrue(historyScreen.isLoaded(), "History screen should load after clicking History tab.");

        nav.navigateToSettings();
        assertTrue(settingsScreen.isLoaded(), "Settings screen should load after clicking Settings tab.");

        nav.navigateToHome();
        assertTrue(dashboardScreen.isLoaded(), "Dashboard screen should reload after clicking Home tab.");
    }
}
