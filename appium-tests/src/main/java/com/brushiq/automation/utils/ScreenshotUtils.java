package com.brushiq.automation.utils;

import io.appium.java_client.AppiumDriver;
import org.apache.commons.io.FileUtils;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

public class ScreenshotUtils {

    public static String captureScreenshot(AppiumDriver driver, String screenshotName) {
        if (driver == null) {
            System.err.println("Driver is null, cannot capture screenshot.");
            return "";
        }
        try {
            File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss_SSS").format(new Date());
            String fileName = screenshotName + "_" + timestamp + ".png";
            
            String targetDirPath = ConfigReader.getProperty("screenshots.path", "screenshots");
            File targetDir = new File(targetDirPath);
            if (!targetDir.exists()) {
                targetDir.mkdirs();
            }

            File destFile = new File(targetDir, fileName);
            FileUtils.copyFile(srcFile, destFile);
            System.out.println("Screenshot captured: " + destFile.getAbsolutePath());
            return destFile.getAbsolutePath();
        } catch (IOException e) {
            System.err.println("Failed to save screenshot: " + e.getMessage());
            return "";
        } catch (Exception e) {
            System.err.println("Exception capturing screenshot: " + e.getMessage());
            return "";
        }
    }

    public static String captureScreenshotAsBase64(AppiumDriver driver) {
        if (driver == null) return "";
        try {
            return ((TakesScreenshot) driver).getScreenshotAs(OutputType.BASE64);
        } catch (Exception e) {
            System.err.println("Failed to capture Base64 screenshot: " + e.getMessage());
            return "";
        }
    }
}
