import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, CommonModule, InputTextModule, ButtonModule],
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
  private cdr = inject(ChangeDetectorRef);

  onLogin() {
    console.log('onLogin called with:', this.username, this.password ? '****' : 'empty');
    if (!this.username || !this.password) {
      console.warn('Username or Password is empty');
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        console.log('Login success');
        this.loading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/layout']);
      },
      error: (err) => {
        console.error('Login error details:', err);
        this.loading = false;
        if (err && err.error) {
          this.errorMessage = err.error.message || err.error.error || 'Credenciales incorrectas.';
        } else {
          this.errorMessage = 'Error de conexión con el servidor. Intente más tarde.';
        }
        console.log('Displayed errorMessage:', this.errorMessage);
        this.cdr.detectChanges();
      }
    });
  }
}
