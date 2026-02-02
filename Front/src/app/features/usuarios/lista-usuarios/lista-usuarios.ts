import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { User } from '../../../core/models/user.model';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';
import { cedulaEcuadorValidator } from '../../../shared/utils/cedula.validator';

@Component({
  selector: 'app-lista-usuarios',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomTable,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './lista-usuarios.html',
  styleUrl: './lista-usuarios.css',
})
export class ListaUsuarios implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  users$!: Observable<User[]>;
  cols: any[] = [];
  actions: TableAction[] = [];

  // Estado del Modal
  displayDialog: boolean = false;
  dialogTitle: string = 'Nuevo Usuario';

  userForm: FormGroup = this.fb.group({
    user_id: [null],
    national_id: ['', [Validators.required, cedulaEcuadorValidator()]],
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.email]],
    address: [''],
    phone: [''],
    status: [true]
  });

  ngOnInit() {
    this.setupColumns();
    this.setupActions();
    this.loadUsers();
    this.setupUppercaseListeners();
  }

  setupUppercaseListeners() {
    ['first_name', 'last_name'].forEach(field => {
      this.userForm.get(field)?.valueChanges.subscribe(value => {
        if (value && value !== value.toUpperCase()) {
          this.userForm.get(field)?.setValue(value.toUpperCase(), { emitEvent: false });
        }
      });
    });
  }

  loadUsers() {
    this.users$ = this.userService.getUsers();
  }

  setupColumns() {
    this.cols = [
      { field: 'national_id', header: 'Cédula' },
      { field: 'last_name', header: 'Apellido' },
      { field: 'first_name', header: 'Nombre' },
      { field: 'email', header: 'Email' },
      { field: 'address', header: 'Dirección' },
      { field: 'phone', header: 'Teléfono' }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Editar Usuario',
        command: (row: User) => this.onEdit(row)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'p-button-text p-button-danger',
        tooltip: 'Eliminar Usuario',
        command: (row: User) => this.onDelete(row)
      }
    ];
  }

  openNew() {
    this.userForm.reset({ status: true });
    this.userForm.get('national_id')?.enable();
    this.dialogTitle = 'Nuevo Usuario';
    this.displayDialog = true;
  }

  onEdit(user: User) {
    this.userForm.patchValue(user);
    this.userForm.get('national_id')?.disable();
    this.dialogTitle = 'Editar Usuario';
    this.displayDialog = true;
  }

  onDelete(user: User) {
    if (!user.user_id) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar a ${user.last_name} ${user.first_name}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.userService.deleteUser(user.user_id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Confirmado', detail: 'Usuario eliminado correctamente' });
            this.loadUsers();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario' });
            console.error(err);
          }
        });
      }
    });
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const userData = this.userForm.getRawValue();
    const userId = userData.user_id;

    if (userId) {
      // Actualizar
      this.userService.updateUser(userId, userData).subscribe({
        next: () => {
          this.displayDialog = false;
          this.loadUsers();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente' });
        },
        error: (err) => {
          const errorMessage = err.error?.error || 'Error al actualizar usuario';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
          console.error(err);
        }
      });
    } else {
      // Crear
      delete userData.user_id;
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.displayDialog = false;
          this.loadUsers();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente' });
        },
        error: (err) => {
          const errorMessage = err.error?.error || 'Error al crear usuario';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
          console.error(err);
        }
      });
    }
  }

  onCancel() {
    this.displayDialog = false;
  }
}
