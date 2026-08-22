import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, CommonModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    if (!this.username || !this.password) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/layout']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.error?.error || 'Error al iniciar sesión. Intente de nuevo.';
      }
    });
  }
}
