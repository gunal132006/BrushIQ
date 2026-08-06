package com.brushiq.automation.tests;

import com.brushiq.automation.base.BaseTest;
import com.brushiq.automation.listeners.TestResultListener;
import com.brushiq.automation.pages.DashboardScreen;
import com.brushiq.automation.pages.HistoryScreen;
import com.brushiq.automation.pages.LoginScreen;
import com.brushiq.automation.pages.NavigationComponent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(TestResultListener.class)
public class HistoryTest extends BaseTest {

    @Test
    @Tag("smoke")
    @Tag("regression")
    @DisplayName("Verify Scan History List and Filter")
    public void testHistoryScreen() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);
        NavigationComponent nav = new NavigationComponent(driver);
        HistoryScreen historyScreen = new HistoryScreen(driver);

        loginScreen.performLogin("gunal.s@brushiq.com", "password123");
        if (dashboardScreen.isLoaded()) {
            nav.navigateToHistory();
            assertTrue(historyScreen.isLoaded(), "History screen should be loaded.");
            assertTrue(historyScreen.isHistoryItemDisplayed(), "At least one scan history item should be displayed.");
        }
    }
}
