export interface Role {
  id: number;
  name: 'ROLE_REPRESENTANTE' | 'ROLE_MIEMBRO';
}

export interface User {
  id: number;
  username: string;
  email: string;
  income: number;
  roles: string[];
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  income: number;
  roles: string[];
  captchaToken: string; // Añade esta línea
}

export interface SignInRequest {
  username: string;
  password: string;
  captchaToken: string; // Añade esta línea
}

export interface AuthResponse {
  id: number;
  username: string;
  token: string;
}


