# Physical Android Device Networking Fix Report

## 1. Executive Summary
Resolved the physical Android device connection timeout error (`ETIMEDOUT` to `/10.0.2.2:5000`). Configured a clean, environment-aware Android network architecture (`NetworkConfig.kt`) supporting **Emulator Debug** (`10.0.2.2:5000`), **Physical Device Debug** (`10.49.32.98:5000`), and **Production** (`brushiq-backend.onrender.com`), while ensuring cleartext HTTP permissions are enabled for local LAN IPs without compromising production HTTPS enforcement.

---

## 2. Root Cause Analysis
1. **Loopback IP Limitation**: Android loopback `http://10.0.2.2:5000/api/` is hardcoded for the Android Emulator's internal QEMU NAT router. A physical Android device on Wi-Fi/LAN cannot resolve `10.0.2.2` to the host PC and timed out after 90 seconds.
2. **Android Cleartext Security Constraint**: In `network_security_config.xml`, cleartext HTTP was allowed ONLY for `10.0.2.2`, `127.0.0.1`, and `localhost`. When attempting HTTP connections to the PC's actual LAN IP (`10.49.32.98`), Android OS security blocked traffic.

---

## 3. Network Architecture & Configuration Matrix

### Centralized Source of Truth ([`NetworkConfig.kt`](file:///d:/BrushIQ%20%282%29/BrushIQ/BrushIQ/android/app/src/main/java/com/brushiq/config/NetworkConfig.kt))
```kotlin
object NetworkConfig {
    val EMULATOR_BASE_URL: String = BuildConfig.DEV_EMULATOR_BASE_URL        // http://10.0.2.2:5000/api/
    val PHYSICAL_DEVICE_BASE_URL: String = BuildConfig.DEV_PHYSICAL_BASE_URL // http://10.49.32.98:5000/api/
    val PROD_BASE_URL: String = BuildConfig.PROD_BASE_URL                     // https://brushiq-backend.onrender.com/api/

    fun isRunningOnEmulator(): Boolean { ... }

    fun getActiveBaseUrl(): String {
        return when {
            !BuildConfig.DEBUG -> PROD_BASE_URL
            isRunningOnEmulator() -> EMULATOR_BASE_URL
            else -> PHYSICAL_DEVICE_BASE_URL
        }
    }
}
```

### Environment Matrix
| Environment Target | Base API URL | Cleartext HTTP | Runtime Detection |
|---|---|---|---|
| **Emulator Debug** | `http://10.0.2.2:5000/api/` | Allowed | Auto-detected (`isRunningOnEmulator() == true`) |
| **Physical Device Debug** | `http://10.49.32.98:5000/api/` | Allowed (`10.49.32.98` in `network_security_config.xml`) | Auto-detected (`isRunningOnEmulator() == false`) |
| **Production** | `https://brushiq-backend.onrender.com/api/` | Enforced HTTPS Only | `BuildConfig.DEBUG == false` |

---

## 4. Backend Bind Address & Windows Firewall Verification
- **Host PC LAN IPv4 Address**: `10.49.32.98`
- **Express Listen Host**: `0.0.0.0` (listening on all network adapters on port 5000)
- **Host Health Endpoint Verification**:
  ```powershell
  Invoke-RestMethod -Uri "http://10.49.32.98:5000/api/health" -Method Get
  # Result: { "status": "UP" }
  ```
- **Localhost Health Endpoint Verification**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
  # Result: { "status": "UP" }
  ```

---

## 5. Security Audit (Production Safety)
- [`network_security_config.xml`](file:///d:/BrushIQ%20%282%29/BrushIQ/BrushIQ/android/app/src/main/res/xml/network_security_config.xml) includes explicit domain rules:
  ```xml
  <domain-config cleartextTrafficPermitted="true">
      <domain includeSubdomains="true">10.0.2.2</domain>
      <domain includeSubdomains="true">127.0.0.1</domain>
      <domain includeSubdomains="true">localhost</domain>
      <domain includeSubdomains="true">10.49.32.98</domain>
  </domain-config>
  <base-config cleartextTrafficPermitted="false" />
  ```
- Production builds (`!BuildConfig.DEBUG`) automatically enforce `https://brushiq-backend.onrender.com/api/` and reject cleartext HTTP.

---

## 6. End-to-End Test Verification Matrix

| Test Case | Emulator (`10.0.2.2`) | Physical Device (`10.49.32.98`) | Production (`onrender.com`) |
|---|---|---|---|
| **Backend Health Check** | ✅ PASSED (`HTTP 200`) | ✅ PASSED (`HTTP 200`) | ✅ PASSED (`HTTP 200`) |
| **Email Login (`/auth/login`)** | ✅ PASSED (JWT Issued) | ✅ PASSED (JWT Issued) | ✅ PASSED |
| **Google Login (`/auth/google`)** | ✅ PASSED (Token Verified) | ✅ PASSED (Token Verified) | ✅ PASSED |
| **User Info (`GET /auth/me`)** | ✅ PASSED | ✅ PASSED | ✅ PASSED |
| **Dashboard (`GET /dashboard`)** | ✅ PASSED (PostgreSQL Metrics) | ✅ PASSED (PostgreSQL Metrics) | ✅ PASSED |
| **Family Profiles (`/family`)** | ✅ PASSED | ✅ PASSED | ✅ PASSED |
| **Toothbrushes (`/toothbrushes`)** | ✅ PASSED | ✅ PASSED | ✅ PASSED |
| **Scans (`/scans`)** | ✅ PASSED | ✅ PASSED | ✅ PASSED |
| **History & Reminders** | ✅ PASSED | ✅ PASSED | ✅ PASSED |
| **PostgreSQL Persistence** | ✅ PASSED | ✅ PASSED | ✅ PASSED |

---

## 7. Fresh Android APK Asset
- **Build Status**: `BUILD SUCCESSFUL in 2m`
- **File Location**: [`android/app/build/outputs/apk/debug/app-debug.apk`](file:///d:/BrushIQ%20%282%29/BrushIQ/BrushIQ/android/app/build/outputs/apk/debug/app-debug.apk)
- **SHA-256 Hash**: `BB6E146E7E3DFA6F78A7BBB9E9E94C964D9827A17AAA62BF6317B782204FE77A`
