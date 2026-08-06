package com.brushiq.automation.drivers;

import com.brushiq.automation.utils.ConfigReader;
import io.appium.java_client.android.options.UiAutomator2Options;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

public class DeviceConfig {

    public static UiAutomator2Options getAndroidOptions() {
        UiAutomator2Options options = new UiAutomator2Options();

        String platformName = ConfigReader.getProperty("platform.name", "Android");
        String deviceName = getConnectedDeviceName();
        String appPath = ConfigReader.getProperty("app.path");
        String appPackage = ConfigReader.getProperty("app.package", "com.brushiq");
        String appActivity = ConfigReader.getProperty("app.activity", ".ui.MainActivity");

        options.setPlatformName(platformName);
        options.setDeviceName(deviceName != null ? deviceName : ConfigReader.getProperty("device.name", "Android Emulator"));
        options.setAutomationName(ConfigReader.getProperty("automation.name", "UiAutomator2"));
        options.setAppPackage(appPackage);
        options.setAppActivity(appActivity);
        options.setAutoGrantPermissions(ConfigReader.getBooleanProperty("auto.grant.permissions", true));
        options.setNewCommandTimeout(Duration.ofSeconds(ConfigReader.getIntProperty("new.command.timeout", 300)));
        options.setNoReset(false);

        if (appPath != null && !appPath.trim().isEmpty()) {
            File apkFile = new File(appPath);
            if (apkFile.exists()) {
                options.setApp(apkFile.getAbsolutePath());
            }
        }

        return options;
    }

    public static String getConnectedDeviceName() {
        try {
            String adbPath = getAdbPath();
            Process process = Runtime.getRuntime().exec(new String[]{adbPath, "devices"});
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            List<String> devices = new ArrayList<>();
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (!line.isEmpty() && !line.startsWith("List of devices") && line.contains("device")) {
                    String[] parts = line.split("\\s+");
                    if (parts.length >= 2 && "device".equals(parts[1])) {
                        devices.add(parts[0]);
                    }
                }
            }
            if (!devices.isEmpty()) {
                System.out.println("Auto-detected active Android device/emulator: " + devices.get(0));
                return devices.get(0);
            }
        } catch (Exception e) {
            System.err.println("Notice: Could not list devices via adb: " + e.getMessage());
        }
        return null;
    }

    private static String getAdbPath() {
        String adb = "adb";
        File sdkAdb = new File("C:\\AndroidSDK\\platform-tools\\adb.exe");
        if (sdkAdb.exists()) {
            return sdkAdb.getAbsolutePath();
        }
        return adb;
    }
}
