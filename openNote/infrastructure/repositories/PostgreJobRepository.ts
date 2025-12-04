import { JobRepository } from "../../application/repositories/JobRepository.ts";
import { getPool } from "../db/postgresClient.ts";

export interface JobRecord {
  job_id: string;
  user_id: string;
  type: string;
  status: string;
  result_url?: string | null;
  error_message?: string | null;
  created_at: Date;
  updated_at: Date;
}

export class PostgreJobRepository implements JobRepository {
  // Không cần Transaction vì mỗi update status là 1 lệnh đơn lẻ

  // tạo job mới với trạng thái pending khi nhận request
  async create(userId: string, type: string): Promise<string> {
    const jobId = crypto.randomUUID();
    const query = `
        INSERT INTO background_jobs (job_id, user_id, type, status)
        VALUES ($1, $2, $3, 'PENDING')
    `;

    const client = await (await getPool()).connect();
    try {
      await client.queryObject(query, [jobId, userId, type]);
      return jobId;
    } finally {
      client.release();
    }
  }

  /* Cập nhật trạng thái và kết quả của job để worker gọi */
  async updateStatus(
    jobId: string,
    status: string,
    resultUrl: string | null = null,
    errorMessage: string | null = null
  ): Promise<void> {
    const query = `
      UPDATE background_jobs
      SET status = $1, result_url = $2, error_message = $3, updated_at = CURRENT_TIMESTAMP
      WHERE job_id = $4
    `;
    const client = await (await getPool()).connect();
    try {
      await client.queryObject(query, [status, resultUrl, errorMessage, jobId]);
    } finally {
      client.release();
    }
  }

  /* Lấy trạng thái của job để frontend polling */
  async findById(jobId: string): Promise<any> {
    const query = `
      SELECT status, result_url
      FROM background_jobs
      WHERE job_id = $1
    `;
    const client = await (await getPool()).connect();
    try {
      const result = await client.queryObject<{
        status: string;
        result_url: string | null;
      }>(query, [jobId]);
      if (result.rows.length === 0) {
        throw new Error("Job not found");
      }
      const row = result.rows[0];
      return { status: row.status, resultUrl: row.result_url };
    } finally {
      client.release();
    }
  }
}
