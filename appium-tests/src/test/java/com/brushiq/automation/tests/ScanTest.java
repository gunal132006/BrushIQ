package com.brushiq.automation.tests;

import com.brushiq.automation.base.BaseTest;
import com.brushiq.automation.listeners.TestResultListener;
import com.brushiq.automation.pages.DashboardScreen;
import com.brushiq.automation.pages.LoginScreen;
import com.brushiq.automation.pages.NavigationComponent;
import com.brushiq.automation.pages.ScanScreen;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(TestResultListener.class)
public class ScanTest extends BaseTest {

    @Test
    @Tag("smoke")
    @Tag("regression")
    @DisplayName("Verify Scan Screen Interface")
    public void testScanScreenControls() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);
        NavigationComponent nav = new NavigationComponent(driver);
        ScanScreen scanScreen = new ScanScreen(driver);

        loginScreen.performLogin("gunal.s@brushiq.com", "password123");
        if (dashboardScreen.isLoaded()) {
            nav.navigateToScan();
            assertTrue(scanScreen.isLoaded(), "Scan screen camera preview should be displayed.");
        }
    }
}
