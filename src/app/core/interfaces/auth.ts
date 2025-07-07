export interface Role {
  id: number;
  name: 'ROLE_REPRESENTANTE' | 'ROLE_MIEMBRO';
}

export interface User {
  id: number;
  username: string;
  email: string;
  income: number;
  roles: string[]; // 👈 EXACTAMENTE ASÍ
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  income: number;
  roles: string[]; // al registrar, sí mandas string[]
}

export interface SignInRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  token: string;
}


