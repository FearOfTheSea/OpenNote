import { apiRequest } from "./http.ts";

export interface SignInRequest {
  email: string;
  password: string;
}
export interface SignInResponse {
  user_id: string;
  user_email: string;
}
export function signIn(payload: SignInRequest): Promise<SignInResponse> {
  return apiRequest<SignInResponse>("/auth/signin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface SignUpRequest {
  fullname: string;
  email: string;
  password: string;
}
export interface SignUpResponse {
  user_id: string;
  user_email: string;
  user_fullname: string;
}
export function signUp(payload: SignUpRequest): Promise<SignUpResponse> {
  return apiRequest<SignUpResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface MeResponse {
  logged_in: boolean;
}
export function getSessionStatus(): Promise<MeResponse> {
  return apiRequest<MeResponse>("/auth/me", {
    method: "GET",
  });
}

export function signOut(): Promise<void> {
  return apiRequest<void>("/auth/signout", {
    method: "POST",
  });
}
