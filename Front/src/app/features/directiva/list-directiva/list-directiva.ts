import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AdministrationsService, Administration } from '../../../core/services/administrations';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-list-directiva',
  standalone: true,
  imports: [CommonModule, RouterModule, CustomTable, ReactiveFormsModule, DialogModule, ButtonModule],
  templateUrl: './list-directiva.html',
  styleUrls: ['./list-directiva.css']
})
export class ListDirectiva implements OnInit {
  administrations: any[] = [];
  columns: any[] = [];
  actions: TableAction[] = [];

  showForm = false;
  isEditMode = false;
  editingId: number | null = null;
  form: FormGroup;

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
    if(confirm('¿Está seguro de eliminar esta directiva?')) {
      this.adminService.delete(id).subscribe(() => {
        this.loadAdministrations();
      });
    }
  }
}
