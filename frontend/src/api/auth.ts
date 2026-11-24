import { apiClient, setAccessToken } from './client';
import { LoginPayload, LoginResponse, RegisterPayload, User } from '../types/auth';

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    skipAuth: true,
  });
  setAccessToken(data.access_token);
  return data;
}

export async function register(payload: RegisterPayload): Promise<User> {
  return apiClient<User>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function getMe(): Promise<User> {
  return apiClient<User>('/auth/me', {
    method: 'GET',
  });
}

export async function logout(): Promise<{ message: string }> {
  try {
    const res = await apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    setAccessToken(null);
    return res;
  } catch (err) {
    setAccessToken(null);
    throw err;
  }
}
