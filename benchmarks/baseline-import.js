import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { SharedArray } from "k6/data";
import { scenario } from "k6/execution";

// 1. LOAD FILE VÀO BỘ NHỚ
const backupData = JSON.parse(open("../backup_sample.json"));

// ==============================================================================
// 2. CONFIGURATION (1000 Users)
// ==============================================================================
const users = new SharedArray("users", function () {
  const data = [];
  for (let i = 1; i <= 1000; i++) {
    data.push({
      email: `user_${i}@stress.com`,
      password: "123456",
    });
  }
  return data;
});

const BASE_URL = "http://localhost:7000";
const errorRate = new Rate("errors");
const importDuration = new Trend("import_duration");

export const options = {
  stages: [
    { duration: "10s", target: 20 }, // Warm up
    { duration: "30s", target: 50 }, // Load trung bình
    { duration: "10s", target: 100 }, // Stress test (Cẩn thận DB bị lock)
    { duration: "30s", target: 50 }, // Giữ tải
    { duration: "10s", target: 0 }, // Cool down
  ],
  thresholds: {
    // Import xử lý logic phức tạp (validate, insert nhiều bảng), cho phép 5s
    http_req_duration: ["p(95)<5000"],
    errors: ["rate<0.05"],
  },
};

// ==============================================================================
// 3. MAIN LOGIC
// ==============================================================================
export default function () {
  // A. Lấy User
  const userIndex = (__VU - 1) % users.length;
  const user = users[userIndex];

  // B. Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/signin`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { "Content-Type": "application/json" } }
  );

  const cookieName = Object.keys(loginRes.cookies)[0];
  const cookieValue = loginRes.cookies[cookieName]
    ? loginRes.cookies[cookieName][0].value
    : null;

  if (!cookieValue) {
    errorRate.add(1);
    console.error(`❌ Login failed for ${user.email}`);
    return;
  }

  // C. Import Action
  const payload = JSON.stringify(backupData);

  const params = {
    headers: {
      "Content-Type": "application/json",
      Cookie: `${cookieName}=${cookieValue}`,
    },
    timeout: "120s",
  };

  const startTime = Date.now();

  const importRes = http.post(`${BASE_URL}/api/backup/import`, payload, params);

  const duration = Date.now() - startTime;
  importDuration.add(duration);

  // D. Validate
  const isSuccess = check(importRes, {
    "status is 200 or 201": (r) => r.status === 200 || r.status === 201,
  });

  errorRate.add(!isSuccess);

  if (!isSuccess) {
    console.warn(
      `⚠️ Import failed [${user.email}]: ${importRes.status} - ${importRes.body.slice(0, 100)}`
    );
  }

  // E. Think Time
  sleep(Math.random() * 5 + 5);
}
