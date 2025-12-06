const API_BASE_URL = "http://localhost:7000/api";

export class ApiError extends Error {
  status: number;
  bodyText?: string;

  constructor(status: number, statusText: string, bodyText?: string) {
    super(`API error ${status}: ${statusText}${bodyText ? ` - ${bodyText}` : ""}`);
    this.status = status;
    this.bodyText = bodyText;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, res.statusText, text || undefined);
  }

  // No-content responses (204, or explicitly with no body)
  if (res.status === 204) {
    // caller should declare T = void in this case
    return undefined as T;
  }

  // Normal JSON responses
  const data = (await res.json()) as T;
  return data;
}
