package com.brushiq.automation.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class LogUtils {
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    public static void info(String message) {
        String log = String.format("[%s] [INFO] %s", LocalDateTime.now().format(formatter), message);
        System.out.println(log);
        ExtentReportManager.logInfo(message);
    }

    public static void error(String message, Throwable t) {
        String log = String.format("[%s] [ERROR] %s - %s", LocalDateTime.now().format(formatter), message, t != null ? t.getMessage() : "");
        System.err.println(log);
        ExtentReportManager.logFail(message + (t != null ? " Exception: " + t.getMessage() : ""));
    }

    public static void warn(String message) {
        String log = String.format("[%s] [WARN] %s", LocalDateTime.now().format(formatter), message);
        System.out.println(log);
        ExtentReportManager.logWarning(message);
    }
}
