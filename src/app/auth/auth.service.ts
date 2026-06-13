import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly sessionKey = 'facturacion_session';

  isLoggedIn(): boolean {
    return localStorage.getItem(this.sessionKey) === 'activa';
  }

  login(correo: string, password: string): boolean {
    if (!correo.trim() || !password.trim()) {
      return false;
    }

    localStorage.setItem(this.sessionKey, 'activa');
    localStorage.setItem('facturacion_user', correo.trim());
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem('facturacion_user');
    this.router.navigate(['/login']);
  }
}
