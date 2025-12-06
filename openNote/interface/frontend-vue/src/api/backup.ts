import { apiRequest } from "./http";

export interface BackupResponse {
  readonly success: boolean;
  readonly message: string;
  readonly jobId: string;
}
export function exportData(): Promise<BackupResponse> {
  return apiRequest<BackupResponse>(`/backup/export`, {
    method: "GET",
  });
}
export function importData(payload: UserData): Promise<BackupResponse> {
  return apiRequest<BackupResponse>(`/backup/import`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface UserData {
  readonly version: number;
  readonly timestamp: string;
  readonly userId: string;
  readonly data: {
    folders: {
      id: string;
      name: string;
      userId: string;
      parentFolderId: string;
      createdAt: string;
      updatedAt: string;
    }[];
    notes: {
      id: string;
      name: string;
      content: string;
      parentFolderId: string;
      tagIds: string[];
      createdAt: string;
      updatedAt: string;
    }[];
    tags: {
      id: string;
      name: string;
    }[];
  };
}
export function downloadData(jobId: string): Promise<UserData> {
  return apiRequest<UserData>(`/backup/download/${jobId}`, {
    method: "GET",
  });
}

export interface JobStatus {
  status: string;
}
export function checkJobStatus(jobId: string): Promise<JobStatus> {
  return apiRequest<JobStatus>(`/jobs/${jobId}`, {
    method: "GET",
  });
}
