import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PanelMenu } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css'],
    imports: [CommonModule, PanelMenu]
})
export class SidebarComponent implements OnInit {
    items!: MenuItem[];

    constructor(private router: Router) { }

    ngOnInit() {
        this.items = [
            // Dashboard - sin submenú
            {
                label: 'Dashboard',
                icon: 'pi pi-home',
                command: () => {
                    this.router.navigate(['/layout/dashboard']);
                }
            },
            // Gestión de Usuarios/Clientes
            {
                label: 'Usuarios',
                icon: 'pi pi-users',
                items: [
                    {
                        label: 'Lista de Usuarios',
                        icon: 'pi pi-list',
                        command: () => {
                            this.router.navigate(['/layout/usuarios']);
                        }
                    },
                ]
            },
            // Gestión de Medidores
            {
                label: 'Medidores',
                icon: 'pi pi-gauge',
                items: [
                    {
                        label: 'Lista de Medidores',
                        icon: 'pi pi-list',
                        command: () => {
                            this.router.navigate(['/layout/medidores']);
                        }
                    },
                    {
                        label: 'Asignar Medidor',
                        icon: 'pi pi-plus-circle',
                        command: () => {
                            this.router.navigate(['/layout/asignar-medidores']);
                        }
                    },
                ]
            },
            // Lecturas
            {
                label: 'Lecturas',
                icon: 'pi pi-chart-line',
                items: [
                    {
                        label: 'Registrar Lectura',
                        icon: 'pi pi-pencil',
                        command: () => {
                            this.router.navigate(['/layout/ingreso-lecturas']);
                        }
                    },
                ]
            },
            // Facturación
            {
                label: 'Facturación',
                icon: 'pi pi-file-edit',
                items: [
                    {
                        label: 'Facturas Emitidas',
                        icon: 'pi pi-plus',
                        command: () => {
                            this.router.navigate(['/layout/facturas']);
                        }
                    }
                ]
            },
            /*
            {
                label: 'Pagos',
                icon: 'pi pi-money-bill',
                items: [
                    {
                        label: 'Registrar Pago',
                        icon: 'pi pi-wallet',
                        command: () => {
                            // TODO: Navegar a registrar pago
                        }
                    },
                    {
                        label: 'Historial de Pagos',
                        icon: 'pi pi-history',
                        command: () => {
                            // TODO: Navegar a historial de pagos
                        }
                    },
                ]
            },*/
            // Rubros Adicionales
            {
                label: 'Rubros Adicionales',
                icon: 'pi pi-plus-circle',
                items: [
                    {
                        label: 'Definir Rubros',
                        icon: 'pi pi-list',
                        command: () => {
                            this.router.navigate(['/layout/rubros-adicionales']);
                        }
                    }
                ]
            },
            // Configuración
            {
                label: 'Configuración',
                icon: 'pi pi-cog',
                items: [
                    {
                        label: 'Tarifas',
                        icon: 'pi pi-dollar',
                        command: () => {
                            this.router.navigate(['/layout/tarifas']);
                        }
                    }
                ]
            },
            // Reportes
            {
                label: 'Reportes',
                icon: 'pi pi-chart-bar',
                items: [
                    {
                        label: 'General',
                        icon: 'pi pi-user',
                        command: () => {
                            this.router.navigate(['/layout/reportes']);
                        }
                    }                    
                ]
            }
        ]
    }
}
