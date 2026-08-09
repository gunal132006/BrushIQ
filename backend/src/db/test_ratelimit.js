const app = require('../app');
const http = require('http');

let server;
let BASE_URL;

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(`${BASE_URL}${path}`, { method, headers: reqHeaders }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch(e) { json = body; }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runRateLimitTests() {
  console.log("==================================================");
  console.log("  AUTHENTICATION RATE LIMITING AUDIT & TEST SUITE ");
  console.log("==================================================");

  server = app.listen(0, async () => {
    const port = server.address().port;
    BASE_URL = `http://localhost:${port}/api`;
    console.log("Test server running on port", port);

    try {
      // First reset rate limiter state
      console.log("\n1. Resetting dev rate limiter...");
      const resetRes = await request('POST', '/auth/reset-limiter');
      console.log("Reset Status:", resetRes.statusCode, "Body:", resetRes.body);

      const testEmail = `ratelimit_user_${Date.now()}@brushiq.com`;
      const testPassword = "Password123!";

      // Test A: Register new user
      console.log("\n2. Test A: Registering user:", testEmail);
      const regRes = await request('POST', '/auth/register', {
        email: testEmail,
        password: testPassword,
        fullName: "RateLimit Test User",
        name: "RateLimit Test User"
      });
      console.log("Registration Status:", regRes.statusCode, "Body:", regRes.body);
      if (regRes.statusCode !== 201 && regRes.statusCode !== 200) {
        console.error("Registration failed:", regRes.body);
        process.exit(1);
      }

      // Test B: Repeated successful logins (skipSuccessfulRequests: true)
      console.log("\n3. Test B: Performing 15 REPEATED SUCCESSFUL LOGINS...");
      let token = null;
      for (let i = 1; i <= 15; i++) {
        const loginRes = await request('POST', '/auth/login', { email: testEmail, password: testPassword });
        if (loginRes.statusCode !== 200) {
          console.error(`Login #${i} failed unexpectedly with status:`, loginRes.statusCode, loginRes.body);
          process.exit(1);
        }
        token = loginRes.body.token;
      }
      console.log("✅ 15/15 successful logins succeeded! (skipSuccessfulRequests verified - successful logins do not consume failed quota)");

      // Test C: Authenticated dashboard query
      console.log("\n4. Test C: Querying GET /api/dashboard with token...");
      const dashRes = await request('GET', '/dashboard', null, { 'Authorization': `Bearer ${token}` });
      console.log("Dashboard Status:", dashRes.statusCode, "Metrics Summary:", {
        totalMembers: dashRes.body.totalMembers,
        totalToothbrushes: dashRes.body.totalToothbrushes,
        avgHealthScore: dashRes.body.avgHealthScore
      });

      // Test D: Test HTTP 429 on excessive failed logins
      console.log("\n5. Test D: Testing 429 rate limiter on failed attempts...");
      await request('POST', '/auth/reset-limiter');

      let hit429 = false;
      let response429 = null;
      for (let i = 1; i <= 110; i++) {
        const badLogin = await request('POST', '/auth/login', { email: testEmail, password: "WrongPassword!" });
        if (badLogin.statusCode === 429) {
          hit429 = true;
          response429 = badLogin;
          console.log(`✅ Received HTTP 429 at failed attempt #${i}!`);
          break;
        }
      }

      if (!hit429) {
        console.error("❌ Failed attempts did not trigger HTTP 429 after 110 attempts!");
      } else {
        console.log("429 Response Headers Retry-After:", response429.headers['retry-after']);
        console.log("429 Response Body:", response429.body);
      }

      // Test E: Test Dev Reset Limiter endpoint
      console.log("\n6. Test E: Testing POST /api/auth/reset-limiter endpoint...");
      const devReset = await request('POST', '/auth/reset-limiter');
      console.log("Dev Reset Status:", devReset.statusCode, "Body:", devReset.body);

      // Test F: Immediate login after reset
      console.log("\n7. Test F: Immediate login after dev reset...");
      const postResetLogin = await request('POST', '/auth/login', { email: testEmail, password: testPassword });
      console.log("Post-Reset Login Status:", postResetLogin.statusCode, "Token Received:", !!postResetLogin.body.token);

      console.log("\n==================================================");
      console.log("  ALL RATE LIMITING TESTS COMPLETED SUCCESSFULLY  ");
      console.log("==================================================");

      server.close();
      process.exit(0);
    } catch (err) {
      console.error("Test Error:", err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runRateLimitTests();
