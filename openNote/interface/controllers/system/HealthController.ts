import { Request, Response } from "express";
import { checkDatabaseHealth } from "../../../infrastructure/db/postgresClient.ts";
import { checkRedisHealth } from "../../../infrastructure/redis/RedisClient.ts";

export class HealthController {
  constructor() {}

  /**
   * Liveness
   * kiểm tra xem process có đang chạy không
   * nếu còn sống thì trả về 200 ok
   */
  getLiveness = (_req: Request, res: Response) => {
    res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
  };

  /**
   * readiness: server có làm việc được không
   * có kết nối được DB & Redis để phục vụ user ?
   */
  getReadiness = async (_req: Request, res: Response) => {
    try {
      const [dbStatus, redisStatus] = await Promise.all([
        checkDatabaseHealth(),
        checkRedisHealth(),
      ]);

      const healthStatus = {
        status: dbStatus && redisStatus ? "UP" : "DOWN",
        timestamp: new Date().toISOString(),
        services: {
          database: dbStatus ? "UP" : "DOWN",
          redis: redisStatus ? "UP" : "DOWN",
        },
      };

      if (dbStatus && redisStatus) {
        return res.status(200).json(healthStatus);
      } else {
        return res.status(503).json(healthStatus);
      }
    } catch (error) {
      return res.status(503).json({
        status: "DOWN",
        error: (error as Error).message,
      });
    }
  };
}
