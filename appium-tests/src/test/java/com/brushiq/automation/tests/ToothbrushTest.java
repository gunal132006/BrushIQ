package com.brushiq.automation.tests;

import com.brushiq.automation.base.BaseTest;
import com.brushiq.automation.listeners.TestResultListener;
import com.brushiq.automation.pages.DashboardScreen;
import com.brushiq.automation.pages.LoginScreen;
import com.brushiq.automation.pages.ToothbrushScreen;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(TestResultListener.class)
public class ToothbrushTest extends BaseTest {

    @Test
    @Tag("regression")
    @DisplayName("Verify Registered Toothbrush List")
    public void testToothbrushScreen() {
        LoginScreen loginScreen = new LoginScreen(driver);
        DashboardScreen dashboardScreen = new DashboardScreen(driver);
        ToothbrushScreen toothbrushScreen = new ToothbrushScreen(driver);

        loginScreen.performLogin("gunal.s@brushiq.com", "password123");
        if (dashboardScreen.isLoaded()) {
            dashboardScreen.clickRegisterBrush();
            assertTrue(toothbrushScreen.isLoaded(), "Toothbrush management screen should open.");
        }
    }
}
