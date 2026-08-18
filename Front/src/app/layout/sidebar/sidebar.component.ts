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
                routerLink: ['/layout/dashboard']
            },
            // Gestión de Usuarios/Clientes
            {
                label: 'Usuarios',
                icon: 'pi pi-users',
                items: [
                    {
                        label: 'Lista de Usuarios',
                        icon: 'pi pi-list',
                        routerLink: ['/layout/usuarios']
                    }
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
                        routerLink: ['/layout/medidores']
                    },
                    {
                        label: 'Asignar Medidor',
                        icon: 'pi pi-plus-circle',
                        routerLink: ['/layout/asignar-medidores']
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
                        routerLink: ['/layout/ingreso-lecturas']
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
                        routerLink: ['/layout/facturas']
                    },
                    {
                        label: 'Cuentas por cobrar',
                        icon: 'pi pi-handshake',
                        routerLink: ['/layout/convenios']
                    }
                ]
            },

            {
                label: 'Caja',
                icon: 'pi pi-money-bill',
                items: [
                    {
                        label: 'Registrar Egreso',
                        icon: 'pi pi-minus-circle',
                        routerLink: ['/layout/registro-egresos']
                    },
                    {
                        label: 'Dashboard',
                        icon: 'pi pi-calculator',
                        routerLink: ['/layout/estado-caja']
                    },
                    {
                        label: 'Ingresos Extraordinarios',
                        icon: 'pi pi-wallet',
                        routerLink: ['/layout/ingresos-extra']
                    },
                    {
                        label: 'Cortes Contables',
                        icon: 'pi pi-chart-pie',
                        routerLink: ['/layout/cortes-caja']
                    },
                ]
            },
            // Rubros Adicionales
            {
                label: 'Rubros Adicionales',
                icon: 'pi pi-plus-circle',
                items: [
                    {
                        label: 'Definir Rubros',
                        icon: 'pi pi-list',
                        routerLink: ['/layout/rubros-adicionales']
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
                        routerLink: ['/layout/tarifas']
                    },
                    {
                        label: 'Categorías Egresos',
                        icon: 'pi pi-tags',
                        routerLink: ['/layout/categorias-egresos']
                    },
                    {
                        label: 'Directivas',
                        icon: 'pi pi-id-card',
                        routerLink: ['/layout/directiva']
                    }
                ]
            },
            // Inventario
            {
                label: 'Inventario y Bienes',
                icon: 'pi pi-box',
                items: [
                    {
                        label: 'Administrar Inventario',
                        icon: 'pi pi-wrench',
                        routerLink: ['/layout/inventario']
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
                        routerLink: ['/layout/reportes']
                    }
                ]
            }
        ]
    }
}
