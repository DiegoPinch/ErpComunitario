import { Component, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [
    ButtonModule,
    TooltipModule,
    CommonModule,
    DialogModule,
    ToastModule,
    InputTextModule,
    ReactiveFormsModule
  ],
  providers: [MessageService]
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  showUserMenu = false;
  displaySettingsDialog = false;
  passwordForm!: FormGroup;
  loading = false;

  get userName(): string {
    return this.authService.getFullName();
  }

  get userRole(): string {
    const br = this.authService.getBoardRole();
    if (br) return br;
    const role = this.authService.getRole();
    return role === 'admin' ? 'Administrador' : 'Socio';
  }

  get userInitials(): string {
    const fn = this.authService.getFirstName();
    const ln = this.authService.getLastName();
    if (!fn && !ln) {
      const username = this.authService.getUsername() || '';
      return username.slice(0, 2).toUpperCase() || 'U';
    }
    return ((fn[0] || '') + (ln[0] || '')).toUpperCase();
  }

  get usernameVal(): string {
    return this.authService.getUsername() || '';
  }

  ngOnInit() {
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  logout() {
    this.showUserMenu = false;
    if (confirm('¿Está seguro de cerrar sesión?')) {
      this.authService.logout();
    }
  }

  openSettings() {
    this.showUserMenu = false;
    this.passwordForm.reset();
    this.displaySettingsDialog = true;
  }

  closeSettings() {
    this.displaySettingsDialog = false;
  }

  savePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const raw = this.passwordForm.getRawValue();

    this.authService.changePassword({
      oldPassword: raw.oldPassword,
      newPassword: raw.newPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Contraseña actualizada correctamente'
        });
        setTimeout(() => {
          this.displaySettingsDialog = false;
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al actualizar contraseña'
        });
      }
    });
  }
}
