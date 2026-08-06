package com.brushiq.automation.tests;

import com.brushiq.automation.base.BaseTest;
import com.brushiq.automation.listeners.TestResultListener;
import com.brushiq.automation.pages.DashboardScreen;
import com.brushiq.automation.pages.LoginScreen;
import com.brushiq.automation.pages.ScanScreen;
import com.brushiq.automation.utils.LogUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(TestResultListener.class)
public class DashboardTest extends BaseTest {

    @Test
    @Tag("smoke")
    @Tag("regression")
    @DisplayName("Verify Dashboard Load and Health Score Card")
    public void testDashboardLoads() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);

        LogUtils.info("Bypassing login if session active or logging in...");
        loginScreen.performLogin("gunal.s@brushiq.com", "password123");

        assertTrue(dashboardScreen.isLoaded(), "Dashboard screen should be loaded.");
        assertTrue(dashboardScreen.isHealthScoreDisplayed(), "Health Score summary card should be visible.");
    }

    @Test
    @Tag("regression")
    @DisplayName("Verify Quick Action Navigation to Scan Screen")
    public void testStartScanFromDashboard() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);
        ScanScreen scanScreen = new ScanScreen(driver);

        loginScreen.performLogin("gunal.s@brushiq.com", "password123");
        if (dashboardScreen.isLoaded()) {
            dashboardScreen.clickStartNewScan();
            assertTrue(scanScreen.isLoaded(), "Scan screen should open upon clicking Start New Scan.");
        }
    }
}
