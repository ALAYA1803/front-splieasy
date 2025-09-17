import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class JwtService {
  private readonly STORAGE_KEY = 'accessToken';


  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }


  private decodePayload(): any | null {
    const token = this.getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }


  getUserId(): string | null {
    const p = this.decodePayload();
    if (!p) return null;
    return p.userId || p.uid || p.sub || null;
  }


  getUsername(): string | null {
    const p = this.decodePayload();
    return p?.username || p?.preferred_username || p?.email || null;
  }


  getRoles(): string[] {
    const p = this.decodePayload();
    if (!p) return [];
    if (Array.isArray(p.roles)) return p.roles;
    if (typeof p.authorities === 'string') return p.authorities.split(' ');
    if (Array.isArray(p.authorities)) return p.authorities;
    if (typeof p.scope === 'string') return p.scope.split(' ');
    return [];
  }
}
