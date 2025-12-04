import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { SharedArray } from "k6/data";

// ==============================================================================
// 1. DATA CONFIGURATION (1000 Users)
// ==============================================================================

const users = new SharedArray("users", function () {
  const data = [];
  // Tạo danh sách khớp với script seed ở trên
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
const exportDuration = new Trend("export_duration");

// ==============================================================================
// 2. STRESS TEST SCENARIO
// ==============================================================================
export const options = {
  stages: [
    { duration: "30s", target: 20 }, // Giai đoạn 1: 20 người dùng nhẹ nhàng
    { duration: "1m", target: 50 }, // Giai đoạn 2: Tăng lên 50 người (Database bắt đầu nóng)
    { duration: "30s", target: 100 }, // SPIKE: Đẩy lên 100 người cùng lúc (Khả năng cao sẽ thấy lỗi ở đây)
    { duration: "1m", target: 100 }, // Stress: Giữ áp lực 100 người trong 1 phút
    { duration: "30s", target: 0 }, // Hạ nhiệt
  ],
  thresholds: {
    // Export 100 note là nặng, cho phép tối đa 20s
    http_req_duration: ["p(95)<20000"],
    // Chấp nhận lỗi 10% khi stress test (vì mục đích là tìm điểm gãy)
    errors: ["rate<0.1"],
    http_req_failed: ["rate<0.1"],
  },
};

// ==============================================================================
// 3. TEST LOGIC
// ==============================================================================
export default function () {
  const userIndex = (__VU - 1) % users.length;
  const user = users[userIndex];

  // 1. Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/signin`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { "Content-Type": "application/json" } }
  );

  // Validate Login

  if (loginRes.status !== 200) {
    console.error(`❌ [User ${user.email}] Login failed: ${loginRes.status}`);

    errorRate.add(1);

    sleep(1);

    return;
  }

  const cookieName = Object.keys(loginRes.cookies)[0];
  const cookieValue = loginRes.cookies[cookieName]
    ? loginRes.cookies[cookieName][0].value
    : null;

  if (!cookieValue) {
    errorRate.add(1);
    return;
  }

  const params = {
    headers: { Cookie: `${cookieName}=${cookieValue}` },
    timeout: "120s", // Timeout phía client k6 (đừng set thấp quá kẻo k6 tự ngắt)
  };

  const startTime = Date.now();
  const exportRes = http.get(`${BASE_URL}/api/backup/export`, params);
  const duration = Date.now() - startTime;

  exportDuration.add(duration);

  // 3. Check
  const isSuccess = check(exportRes, {
    "status is 200": (r) => r.status === 200,
    "has content": (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!isSuccess);

  sleep(Math.random() * 5 + 5);
}
