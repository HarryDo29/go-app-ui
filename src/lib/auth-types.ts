// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  user_name: string;
  email: string;
  role: string;
  is_active: boolean;
  avatar_url: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
