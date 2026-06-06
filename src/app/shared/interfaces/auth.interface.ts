export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  email:    string;
  name:     string;
  password: string;
}

export interface User {
  id:        string;
  email:     string;
  name:      string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  user:         User;
}

export interface RefreshResponse {
  accessToken:  string;
  refreshToken: string;
}
