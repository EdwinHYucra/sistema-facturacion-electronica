import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Eye, Lock, LucideAngularModule, Mail, ReceiptText } from 'lucide-angular';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  icons = {
    Eye,
    Lock,
    Mail,
    ReceiptText
  };

  correo = 'usuario@ferreycorp.com.pe';
  password = 'admin123';
  recordar = false;
  mostrarPassword = false;
  error = '';

  iniciarSesion(): void {
    if (!this.auth.login(this.correo, this.password)) {
      this.error = 'Ingrese correo y contrasena para continuar.';
      return;
    }

    this.error = '';
    this.router.navigate(['/dashboard']);
  }
}
