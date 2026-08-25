import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css'],
    imports: [CommonModule, RouterLink, RouterLinkActive]
})
export class SidebarComponent implements OnInit {
    items!: MenuItem[];
    expandedMenu: string | null = null;

    private authService = inject(AuthService);
    private router = inject(Router);
    private confirmService = inject(ConfirmService);

    ngOnInit() {
        this.generateMenu();
    }

    toggleSubmenu(item: MenuItem) {
        if (!item.label) return;
        if (this.expandedMenu === item.label) {
            this.expandedMenu = null;
        } else {
            this.expandedMenu = item.label;
        }
    }

    isExpanded(item: MenuItem): boolean {
        return !!item.label && this.expandedMenu === item.label;
    }

    generateMenu() {
        const role = this.authService.getRole();
        const boardRole = (this.authService.getBoardRole() || '').toUpperCase();

        const allItems: { menu: string; item: MenuItem }[] = [
            // Dashboard - sin submenú
            {
                menu: 'dashboard',
                item: {
                    label: 'Dashboard',
                    icon: 'pi pi-home',
                    routerLink: ['/layout/dashboard']
                }
            },
            // Gestión de Usuarios/Clientes
            {
                menu: 'usuarios',
                item: {
                    label: 'Usuarios',
                    icon: 'pi pi-users',
                    items: [
                        {
                            label: 'Lista de Usuarios',
                            icon: 'pi pi-list',
                            routerLink: ['/layout/usuarios']
                        }
                    ]
                }
            },
            // Gestión de Medidores
            {
                menu: 'medidores',
                item: {
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
                        }
                    ]
                }
            },
            // Lecturas
            {
                menu: 'lecturas',
                item: {
                    label: 'Lecturas',
                    icon: 'pi pi-chart-line',
                    items: [
                        {
                            label: 'Registrar Lectura',
                            icon: 'pi pi-pencil',
                            routerLink: ['/layout/ingreso-lecturas']
                        }
                    ]
                }
            },
            // Facturación
            {
                menu: 'facturacion',
                item: {
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
                }
            },
            // Caja
            {
                menu: 'caja',
                item: {
                    label: 'Caja',
                    icon: 'pi pi-money-bill',
                    items: [
                        {
                            label: 'Registrar Egreso',
                            icon: 'pi pi-minus-circle',
                            routerLink: ['/layout/registro-egresos']
                        },
                        {
                            label: 'Dashboard Caja',
                            icon: 'pi pi-calculator',
                            routerLink: ['/layout/estado-caja']
                        },
                        {
                            label: 'Ingresos Extraordinarios',
                            icon: 'pi pi-wallet',
                            routerLink: ['/layout/ingresos-extra']
                        },
                        {
                            label: 'Cuentas Bancarias',
                            icon: 'pi pi-building',
                            routerLink: ['/layout/cuentas-bancarias']
                        },
                        {
                            label: 'Cortes Contables',
                            icon: 'pi pi-chart-pie',
                            routerLink: ['/layout/cortes-caja']
                        }
                    ]
                }
            },
            // Rubros Adicionales
            {
                menu: 'rubros',
                item: {
                    label: 'Rubros Adicionales',
                    icon: 'pi pi-plus-circle',
                    items: [
                        {
                            label: 'Definir Rubros',
                            icon: 'pi pi-list',
                            routerLink: ['/layout/rubros-adicionales']
                        }
                    ]
                }
            },
            // Reuniones y Asistencia
            {
                menu: 'reuniones',
                item: {
                    label: 'Reuniones y Asistencia',
                    icon: 'pi pi-calendar',
                    items: [
                        {
                            label: 'Lista de Reuniones',
                            icon: 'pi pi-list',
                            routerLink: ['/layout/reuniones']
                        },
                        {
                            label: 'Configurar Multas',
                            icon: 'pi pi-dollar',
                            routerLink: ['/layout/configuracion/multas']
                        }
                    ]
                }
            },
            // Configuración
            {
                menu: 'configuracion',
                item: {
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
                }
            },
            // Inventario
            {
                menu: 'inventario',
                item: {
                    label: 'Inventario y Bienes',
                    icon: 'pi pi-box',
                    items: [
                        {
                            label: 'Administrar Inventario',
                            icon: 'pi pi-wrench',
                            routerLink: ['/layout/inventario']
                        }
                    ]
                }
            },
            // Reportes
            {
                menu: 'reportes',
                item: {
                    label: 'Reportes',
                    icon: 'pi pi-chart-bar',
                    items: [
                        {
                            label: 'General',
                            icon: 'pi pi-user',
                            routerLink: ['/layout/reportes']
                        },
                        {
                            label: 'Financieros',
                            icon: 'pi pi-dollar',
                            routerLink: ['/layout/reportes-financieros']
                        }
                    ]
                }
            }
        ];

        // Si el rol es admin, inyectamos la opción de usuarios de sistema en el submenú de configuración
        if (role === 'admin') {
            const configMenu = allItems.find(x => x.menu === 'configuracion');
            if (configMenu && configMenu.item.items) {
                // Evitamos duplicar en caso de múltiples llamadas
                const exists = configMenu.item.items.some(sub => sub.routerLink?.[0] === '/layout/configuracion/usuarios-sistema');
                if (!exists) {
                    configMenu.item.items.push({
                        label: 'Usuarios del Sistema',
                        icon: 'pi pi-users',
                        routerLink: ['/layout/configuracion/usuarios-sistema']
                    });
                }
            }
        }

        let visibleMenus: string[] = [];

        if (role === 'admin') {
            visibleMenus = allItems.map(x => x.menu);
        } else if (role === 'board') {
            if (boardRole.includes('PRESIDENTE')) {
                visibleMenus = ['dashboard', 'usuarios', 'medidores', 'reuniones', 'configuracion', 'inventario', 'reportes'];
            } else if (boardRole.includes('TESORERO')) {
                visibleMenus = ['dashboard', 'caja', 'facturacion', 'rubros', 'lecturas', 'reportes'];
            } else if (boardRole.includes('SECRETAR')) {
                visibleMenus = ['usuarios', 'medidores', 'lecturas', 'reuniones'];
            } else {
                visibleMenus = ['dashboard', 'usuarios', 'medidores', 'reuniones', 'reportes'];
            }
        } else {
            visibleMenus = ['dashboard'];
        }

        this.items = allItems
            .filter(x => visibleMenus.includes(x.menu))
            .map(x => x.item);

        // Agregar la opción de Cerrar Sesión al final del menú
        this.items.push({
            label: 'Cerrar Sesión',
            icon: 'pi pi-sign-out',
            command: () => this.logout()
        });
    }

    logout() {
        this.confirmService.confirm({
            header: 'Cerrar Sesión',
            message: '¿Está seguro de que desea cerrar sesión en YakuGest?',
            acceptLabel: 'Salir',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.authService.logout();
            }
        });
    }
}
