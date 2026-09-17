import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AdministrationsService, Administration } from '../../../core/services/administrations';
import { BoardMembersService } from '../../../core/services/board-members.service';
import { UserService } from '../../../core/services/user.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';

@Component({
  selector: 'app-list-directiva',
  standalone: true,
  imports: [CommonModule, RouterModule, CustomTable, ReactiveFormsModule, DialogModule, ButtonModule],
  templateUrl: './list-directiva.html',
  styleUrls: ['./list-directiva.css']
})
export class ListDirectiva implements OnInit {
  private confirmService = inject(ConfirmService);
  administrations: any[] = [];
  columns: any[] = [];
  actions: TableAction[] = [];

  showForm = false;
  isEditMode = false;
  editingId: number | null = null;
  form: FormGroup;

  // Integrantes directiva
  showMembers = false;
  selectedAdminId: number | null = null;
  selectedAdminName = '';
  members: any[] = [];
  users: any[] = [];
  memberForm: FormGroup;

  private boardMembersService = inject(BoardMembersService);
  private userService = inject(UserService);

  constructor(
    private adminService: AdministrationsService, 
    private cdr: ChangeDetectorRef,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: [''],
      status: ['active', Validators.required]
    });

    this.memberForm = this.fb.group({
      user_id: [null, Validators.required],
      role: ['PRESIDENTE', Validators.required]
    });
  }

  ngOnInit(): void {
    this.setupTable();
    this.loadAdministrations();
  }

  setupTable() {
    this.columns = [
      { field: 'name', header: 'Nombre' },
      { field: 'start_date', header: 'Fecha Inicio', type: 'date' },
      { field: 'end_date', header: 'Fecha Fin', type: 'date' },
      { field: 'status_label', header: 'Estado' }
    ];

    this.actions = [
      {
        icon: 'pi pi-users',
        tooltip: 'Ver Integrantes (Directivos)',
        styleClass: 'p-button-text p-button-success',
        command: (row: any) => this.manageMembers(row)
      },
      {
        icon: 'pi pi-pencil',
        tooltip: 'Editar',
        styleClass: 'p-button-text p-button-info',
        command: (row: any) => this.editAdmin(row)
      },
      {
        icon: 'pi pi-trash',
        tooltip: 'Eliminar',
        styleClass: 'p-button-text p-button-danger',
        command: (row: any) => this.deleteAdmin(row.administration_id)
      }
    ];
  }

  loadAdministrations() {
    this.adminService.getAll().subscribe(data => {
      this.administrations = data.map(admin => ({
        ...admin,
        status_label: admin.status === 'active' ? 'Activa' : 'Completada'
      }));
      this.cdr.detectChanges();
    });
  }

  openNew() {
    this.isEditMode = false;
    this.editingId = null;
    this.form.reset({ status: 'active' });
    this.showForm = true;
  }

  editAdmin(admin: any) {
    this.isEditMode = true;
    this.editingId = admin.administration_id;
    this.form.patchValue({
      name: admin.name,
      start_date: admin.start_date ? new Date(admin.start_date).toISOString().split('T')[0] : '',
      end_date: admin.end_date ? new Date(admin.end_date).toISOString().split('T')[0] : '',
      status: admin.status
    });
    this.showForm = true;
  }

  hideDialog() {
    this.showForm = false;
  }

  onSubmit() {
    if (this.form.valid) {
      if (this.isEditMode && this.editingId) {
        this.adminService.update(this.editingId, this.form.value).subscribe(() => {
          this.loadAdministrations();
          this.hideDialog();
        });
      } else {
        this.adminService.create(this.form.value).subscribe(() => {
          this.loadAdministrations();
          this.hideDialog();
        });
      }
    }
  }

  deleteAdmin(id: number) {
    this.confirmService.confirm({header:'Eliminar directiva', message:'¿Está seguro de eliminar esta directiva?', acceptLabel:'Eliminar', accept: () => {
      this.adminService.delete(id).subscribe(() => {
        this.loadAdministrations();
      });
    }});
  }

  manageMembers(admin: any) {
    this.selectedAdminId = admin.administration_id;
    this.selectedAdminName = admin.name;
    this.loadMembers();
    this.loadUsers();
    this.memberForm.reset({
      user_id: null,
      role: 'PRESIDENTE'
    });
    this.showMembers = true;
  }

  loadMembers() {
    if (!this.selectedAdminId) return;
    this.boardMembersService.getAll(this.selectedAdminId).subscribe(data => {
      this.members = data;
      this.cdr.detectChanges();
    });
  }

  loadUsers() {
    if (this.users.length > 0) return;
    this.userService.getUsers().subscribe(data => {
      this.users = data.filter(u => !u.exempt_from_fines);
      this.cdr.detectChanges();
    });
  }

  addMember() {
    if (this.memberForm.invalid || !this.selectedAdminId) return;
    const raw = this.memberForm.value;
    const newMember = {
      administration_id: this.selectedAdminId,
      user_id: parseInt(raw.user_id),
      role: raw.role,
      start_date: new Date().toISOString().split('T')[0],
      active: 1
    };
    this.boardMembersService.create(newMember).subscribe({
      next: () => {
        this.loadMembers();
        this.memberForm.reset({ user_id: null, role: 'PRESIDENTE' });
      },
      error: (err) => console.error('Error al agregar integrante', err)
    });
  }

  removeMember(boardId: number) {
    this.confirmService.confirm({header:'Retirar integrante', message:'¿Está seguro de quitar a este integrante de la directiva?', acceptLabel:'Retirar', accept: () => {
      this.boardMembersService.delete(boardId).subscribe({
        next: () => {
          this.loadMembers();
        },
        error: (err) => console.error('Error al eliminar integrante', err)
      });
    }});
  }
}
