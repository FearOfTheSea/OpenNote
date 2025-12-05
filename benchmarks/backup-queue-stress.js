import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { SharedArray } from "k6/data";

// ==============================================================================
// 1. CONFIGURATION
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

// Custom Metrics
const errorRate = new Rate("errors");
// 1. Thời gian API phản hồi (Enqueue)
const enqueueDuration = new Trend("enqueue_duration");
// 2. Thời gian Worker xử lý xong (End-to-End)
const processingDuration = new Trend("processing_duration");

// ==============================================================================
// 2. TEST SCENARIO
// ==============================================================================
export const options = {
  stages: [
    { duration: "30s", target: 50 }, // Ramp up
    { duration: "1m", target: 100 }, // Stress: 100 người cùng bấm Backup
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    enqueue_duration: ["p(95)<500"],

    // Thời gian xử lý ngầm, 95% phải xong trong 30s
    processing_duration: ["p(95)<30000"],

    errors: ["rate<0.05"], // Chấp nhận lỗi dưới 5%
  },
};

// ==============================================================================
// 3. MAIN LOGIC
// ==============================================================================
export default function () {
  const userIndex = (__VU - 1) % users.length;
  const user = users[userIndex];

  // --- STEP 1: LOGIN ---
  const loginRes = http.post(
    `${BASE_URL}/api/auth/signin`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { "Content-Type": "application/json" } },
  );

  if (loginRes.status !== 200) {
    console.error(`❌ Login Failed for ${user.email}`);
    console.error(`👉 Status: ${loginRes.status}`);
    console.error(`👉 Response: ${loginRes.body}`); // <--- QUAN TRỌNG NHẤT
    errorRate.add(1);
    return;
  }

  const cookieName = Object.keys(loginRes.cookies)[0];
  const cookieValue = loginRes.cookies[cookieName] ? loginRes.cookies[cookieName][0].value : null;

  // Header chung
  const params = {
    headers: {
      "Content-Type": "application/json",
      Cookie: `${cookieName}=${cookieValue}`,
    },
  };

  // --- STEP 2: TRIGGER BACKUP (Enqueue) ---
  const startEnqueue = Date.now();

  const enqueueRes = http.get(`${BASE_URL}/api/backup/export`, params);

  const enqueueTime = Date.now() - startEnqueue;
  enqueueDuration.add(enqueueTime); // Ghi nhận thời gian API phản hồi

  // Validate Enqueue thành công
  const isEnqueued = check(enqueueRes, {
    // 1. Chấp nhận cả 200 và 201
    "status is 200 or 201 or 202": (r) => r.status === 200 || r.status === 201 || r.status === 202,

    // 2. Kiểm tra logic JSON trả về
    "api reports success": (r) => {
      try {
        return r.json("success") === true;
      } catch (e) {
        return false;
      } // Đề phòng lỗi parse JSON
    },

    "has jobId": (r) => r.json("jobId") !== undefined && r.json("jobId") !== null,
  });

  errorRate.add(!isEnqueued);

  if (!isEnqueued) {
    console.error(`❌ [User ${user.email}] Enqueue failed: ${enqueueRes.body}`);
    errorRate.add(1);
    return;
  }

  const jobId = enqueueRes.json("jobId");

  // --- STEP 3: POLLING (Chờ Worker xử lý) ---
  // Vòng lặp kiểm tra trạng thái job

  let jobStatus = "PENDING";
  const startProcessing = Date.now();
  const maxRetries = 20; // Thử tối đa 20 lần
  const pollInterval = 5; // Mỗi 2 giây hỏi 1 lần
  let retryCount = 0;

  while (
    jobStatus !== "COMPLETED" &&
    jobStatus !== "FAILED" &&
    retryCount < maxRetries
  ) {
    // Nghỉ một chút trước khi hỏi
    sleep(pollInterval);

    // Gọi API check status
    const pollRes = http.get(`${BASE_URL}/api/jobs/${jobId}`, params);

    if (pollRes.status === 200) {
      jobStatus = pollRes.json("status"); // PENDING, PROCESSING, COMPLETED, FAILED
    } else {
      // Lỗi mạng hoặc server quá tải khi poll
      console.warn(`⚠️ Polling error for Job ${jobId}: ${pollRes.status}`);
    }

    retryCount++;
  }

  const totalProcessingTime = Date.now() - startProcessing;

  // --- STEP 4: VERIFY RESULT ---
  const isProcessed = check(null, {
    "Job Completed": () => jobStatus === "COMPLETED",
    "Processing within limit": () => totalProcessingTime < 60000, // Timeout cứng 60s
  });

  if (isProcessed) {
    // Chỉ ghi nhận thời gian nếu thành công
    processingDuration.add(totalProcessingTime);
  } else {
    console.error(
      `❌ [User ${user.email}] Job Timeout/Failed. Status: ${jobStatus}`,
    );
    errorRate.add(1);
  }

  sleep(2);
}
