package com.brushiq.automation.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

public class ConfigReader {
    private static final Properties properties = new Properties();

    static {
        try {
            File configFile = new File("config/config.properties");
            if (!configFile.exists()) {
                configFile = new File("appium-tests/config/config.properties");
            }
            if (configFile.exists()) {
                try (FileInputStream fis = new FileInputStream(configFile)) {
                    properties.load(fis);
                }
            }
        } catch (IOException e) {
            System.err.println("Warning: Unable to load config.properties file: " + e.getMessage());
        }
    }

    public static String getProperty(String key, String defaultValue) {
        String sysProp = System.getProperty(key);
        if (sysProp != null && !sysProp.trim().isEmpty()) {
            return sysProp.trim();
        }
        String prop = properties.getProperty(key);
        if (prop != null && !prop.trim().isEmpty()) {
            return prop.trim();
        }
        return defaultValue;
    }

    public static String getProperty(String key) {
        return getProperty(key, null);
    }

    public static int getIntProperty(String key, int defaultValue) {
        String val = getProperty(key);
        if (val != null) {
            try {
                return Integer.parseInt(val.trim());
            } catch (NumberFormatException ignored) {}
        }
        return defaultValue;
    }

    public static boolean getBooleanProperty(String key, boolean defaultValue) {
        String val = getProperty(key);
        if (val != null) {
            return Boolean.parseBoolean(val.trim());
        }
        return defaultValue;
    }
}
