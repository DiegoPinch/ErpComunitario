import { Component, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  imports: [ButtonModule, TooltipModule, CommonModule]
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  userName = 'Juan Pérez';
  userRole = 'Administrador';
  userInitials = 'JP';

  showUserMenu = false;

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  logout() {
    console.log('Cerrar sesión');
    // TODO: Implementar lógica de logout
  }

  openSettings() {
    console.log('Abrir configuración');
    // TODO: Implementar configuración de usuario
  }
}
