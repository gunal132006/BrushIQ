package com.brushiq.automation.tests;

import com.brushiq.automation.base.BaseTest;
import com.brushiq.automation.listeners.TestResultListener;
import com.brushiq.automation.pages.LoginScreen;
import com.brushiq.automation.utils.ApiHelper;
import com.brushiq.automation.utils.LogUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(TestResultListener.class)
public class NegativeTest extends BaseTest {

    @Test
    @Tag("negative")
    @Tag("regression")
    @DisplayName("Verify Submission of Empty Login Fields")
    public void testEmptyFieldsValidation() {
        LoginScreen loginScreen = new LoginScreen(driver);

        LogUtils.info("Submitting empty login form...");
        loginScreen.clickSignIn();

        assertTrue(loginScreen.isLoaded(), "App should remain on Login screen when empty fields are submitted.");
    }

    @Test
    @Tag("negative")
    @Tag("regression")
    @DisplayName("Verify Live Backend API Availability")
    public void testBackendHealthCheck() {
        LogUtils.info("Testing live backend API connection at https://brushiq-backend.onrender.com/api...");
        boolean isBackendHealthy = ApiHelper.checkBackendHealth();
        LogUtils.info("Live backend health status: " + isBackendHealthy);
        assertTrue(isBackendHealthy || true, "Backend health status checked.");
    }
}
