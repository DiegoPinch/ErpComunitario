import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SystemUsersService, SystemUser } from '../../../core/services/system-users.service';
import { UserService } from '../../../core/services/user.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-usuarios-sistema',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    CustomTable
  ],
  providers: [MessageService],
  templateUrl: './usuarios-sistema.html',
  styleUrls: ['./usuarios-sistema.css']
})
export class UsuariosSistemaComponent implements OnInit {
  private systemUsersService = inject(SystemUsersService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmService);
  private cdr = inject(ChangeDetectorRef);

  systemUsers: any[] = [];
  sociosList: any[] = [];
  columns: any[] = [];
  actions: TableAction[] = [];

  displayDialog: boolean = false;
  isEditMode: boolean = false;
  dialogTitle: string = 'Nuevo Acceso de Sistema';
  
  userForm: FormGroup;

  roles = [
    { label: 'Administrador Técnico', value: 'admin' },
    { label: 'Miembro de Directiva', value: 'board' },
    { label: 'Socio / Usuario Básico', value: 'user' }
  ];

  constructor() {
    this.userForm = this.fb.group({
      system_user_id: [null],
      user_id: [null, Validators.required],
      username: ['', Validators.required],
      password: [''],
      role: ['user', Validators.required],
      status: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    this.setupTable();
    this.loadSystemUsers();
    this.loadSocios();
  }

  setupTable() {
    this.columns = [
      { field: 'username', header: 'Usuario' },
      { field: 'full_name', header: 'Nombre del Socio' },
      { field: 'national_id', header: 'Cédula' },
      { field: 'role_label', header: 'Rol Técnico' },
      { 
        field: 'status_label', 
        header: 'Estado',
        type: 'tag',
        tagSeverity: (val: string) => val === 'ACTIVO' ? 'success' : 'danger'
      }
    ];

    this.actions = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Editar cuenta y clave',
        command: (row: any) => this.onEdit(row)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'p-button-text p-button-danger',
        tooltip: 'Eliminar cuenta',
        command: (row: any) => this.onDelete(row)
      }
    ];
  }

  loadSystemUsers() {
    this.systemUsersService.getAll().subscribe({
      next: (data) => {
        this.systemUsers = data.map(u => ({
          ...u,
          full_name: `${u.last_name || ''} ${u.first_name || ''}`.trim() || 'Administrador Inicial',
          role_label: this.getRoleLabel(u.role),
          status_label: u.status === 1 || u.status === true ? 'ACTIVO' : 'INACTIVO'
        }));
        this.cdr.detectChanges();
      },
      error: () => this.showError('No se pudo cargar la lista de usuarios del sistema')
    });
  }

  loadSocios() {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.sociosList = data.map(u => ({
          label: `${u.last_name} ${u.first_name} (${u.national_id})`,
          value: u.user_id
        }));
        this.cdr.detectChanges();
      }
    });
  }

  getRoleLabel(role: string): string {
    const found = this.roles.find(r => r.value === role);
    return found ? found.label : role;
  }

  openNew() {
    this.isEditMode = false;
    this.dialogTitle = 'Nuevo Acceso de Sistema';
    this.userForm.reset({
      role: 'user',
      status: true
    });
    this.userForm.get('user_id')?.enable();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(4)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.displayDialog = true;
  }

  onEdit(row: any) {
    this.isEditMode = true;
    this.dialogTitle = 'Editar Acceso de Sistema';
    this.userForm.reset();
    this.userForm.patchValue({
      system_user_id: row.system_user_id,
      user_id: row.user_id,
      username: row.username,
      role: row.role,
      status: row.status === 1 || row.status === true
    });
    
    // Al editar, el socio no se puede cambiar y la contraseña es opcional
    this.userForm.get('user_id')?.disable();
    this.userForm.get('password')?.setValidators(null);
    this.userForm.get('password')?.updateValueAndValidity();
    this.displayDialog = true;
  }

  onDelete(row: any) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar de forma permanente la cuenta de acceso "${row.username}"?`,
      header: 'Confirmar Eliminación',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.systemUsersService.delete(row.system_user_id).subscribe({
          next: () => {
            this.showSuccess('Usuario del sistema eliminado');
            this.loadSystemUsers();
          },
          error: (err) => this.showError(err.error?.message || 'Error al eliminar el usuario')
        });
      }
    });
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const rawData = this.userForm.getRawValue();
    const systemUserId = rawData.system_user_id;

    const payload: SystemUser = {
      user_id: rawData.user_id,
      username: rawData.username,
      role: rawData.role,
      status: rawData.status ? 1 : 0
    };

    // Si se especificó contraseña (o si es creación donde es obligatoria)
    if (rawData.password) {
      payload.password = rawData.password;
    }

    if (this.isEditMode && systemUserId) {
      this.systemUsersService.update(systemUserId, payload).subscribe({
        next: () => {
          this.showSuccess('Acceso de sistema actualizado correctamente');
          this.displayDialog = false;
          this.loadSystemUsers();
        },
        error: (err) => this.showError(err.error?.message || err.error?.error || 'Error al actualizar')
      });
    } else {
      this.systemUsersService.create(payload).subscribe({
        next: () => {
          this.showSuccess('Acceso de sistema creado correctamente');
          this.displayDialog = false;
          this.loadSystemUsers();
        },
        error: (err) => this.showError(err.error?.message || err.error?.error || 'Error al crear')
      });
    }
  }

  onCancel() {
    this.displayDialog = false;
  }

  private showSuccess(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
  }

  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
  }
}
