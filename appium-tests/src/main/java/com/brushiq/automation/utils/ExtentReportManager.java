package com.brushiq.automation.utils;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.MediaEntityBuilder;
import com.aventstack.extentreports.Status;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.aventstack.extentreports.reporter.configuration.Theme;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;

public class ExtentReportManager {
    private static ExtentReports extent;
    private static final ThreadLocal<ExtentTest> testThreadLocal = new ThreadLocal<>();

    public static synchronized ExtentReports getInstance() {
        if (extent == null) {
            String reportsDir = ConfigReader.getProperty("reports.path", "reports");
            File dir = new File(reportsDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
            String reportFilePath = reportsDir + File.separator + "BrushIQ_Appium_Test_Report_" + timestamp + ".html";
            String latestReportPath = reportsDir + File.separator + "index.html";

            ExtentSparkReporter spark = new ExtentSparkReporter(reportFilePath);
            ExtentSparkReporter sparkLatest = new ExtentSparkReporter(latestReportPath);

            spark.config().setDocumentTitle("BrushIQ Android Automation Execution Report");
            spark.config().setReportName("BrushIQ Mobile Appium Test Suite");
            spark.config().setTheme(Theme.DARK);

            sparkLatest.config().setDocumentTitle("BrushIQ Android Automation Execution Report");
            sparkLatest.config().setReportName("BrushIQ Mobile Appium Test Suite");
            sparkLatest.config().setTheme(Theme.DARK);

            extent = new ExtentReports();
            extent.attachReporter(spark, sparkLatest);
            extent.setSystemInfo("Application", "BrushIQ Android App");
            extent.setSystemInfo("Platform", "Android");
            extent.setSystemInfo("Framework", "Appium + JUnit 5 + Java");
            extent.setSystemInfo("Backend Endpoint", ConfigReader.getProperty("api.base.url", "https://brushiq-backend.onrender.com/api"));
            extent.setSystemInfo("Environment", "Production CI/CD");
        }
        return extent;
    }

    public static synchronized ExtentTest createTest(String testName, String description) {
        ExtentTest test = getInstance().createTest(testName, description);
        testThreadLocal.set(test);
        return test;
    }

    public static ExtentTest getTest() {
        return testThreadLocal.get();
    }

    public static void logPass(String details) {
        if (getTest() != null) {
            getTest().log(Status.PASS, details);
        }
    }

    public static void logFail(String details) {
        if (getTest() != null) {
            getTest().log(Status.FAIL, details);
        }
    }

    public static void logFailWithScreenshot(String details, String screenshotPath) {
        if (getTest() != null) {
            if (screenshotPath != null && !screenshotPath.isEmpty()) {
                getTest().log(Status.FAIL, details, MediaEntityBuilder.createScreenCaptureFromPath(screenshotPath).build());
            } else {
                getTest().log(Status.FAIL, details);
            }
        }
    }

    public static void logInfo(String details) {
        if (getTest() != null) {
            getTest().log(Status.INFO, details);
        }
    }

    public static void logWarning(String details) {
        if (getTest() != null) {
            getTest().log(Status.WARNING, details);
        }
    }

    public static synchronized void flush() {
        if (extent != null) {
            extent.flush();
        }
    }
}
