import { JobRepository } from "../../../application/repositories/JobRepository.ts";

export class GetJobStatusController {
  constructor(private jobRepo: JobRepository) {}

  async apply(req: any, res: any) {
    try {
      const jobId = req.params.id;

      if (!jobId) {
        return res.status(400).json({ error: "Missing Job ID" });
      }

      // Gọi Repository tìm job
      const job = await this.jobRepo.findById(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Trả về trạng thái để Frontend polling
      return res.json(job);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  }
}
