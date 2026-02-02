import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { UserService } from '../../../core/services/user.service';
import { MeterHistoryService } from '../../../core/services/meter-history.service';
import { User } from '../../../core/models/user.model';
import { Meter } from '../../../core/models/meter.model';
import { MeterHistory } from '../../../core/models/meter-history.model';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-asignar-medidores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ListboxModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ProgressSpinnerModule,
    CustomTable
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './asignar-medidores.html',
  styleUrl: './asignar-medidores.css',
})
export class AsignarMedidores implements OnInit {
  private userService = inject(UserService);
  private meterHistoryService = inject(MeterHistoryService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  users: User[] = [];
  filteredUsers: User[] = []; // Property instead of getter
  availableMeters: Meter[] = [];
  selectedUser: User | null = null;
  userAssignments: any[] = []; // Using any to allow mapped properties
  cols: any[] = [];
  actions: TableAction[] = [];

  // UI
  loading: boolean = false;
  loadingAssignments: boolean = false;
  displayDialog: boolean = false;
  displayQuickDialog: boolean = false;
  assignmentForm: FormGroup;
  quickSetupForm: FormGroup;
  searchTerm: string = '';

  constructor() {
    this.assignmentForm = this.fb.group({
      meter_id: [null, Validators.required],
      user_id: [null, Validators.required],
      assignment_date: [new Date(), Validators.required],
      assigned: [true]
    });

    this.quickSetupForm = this.fb.group({
      code: [{ value: '', disabled: true }, Validators.required],
      type: ['consumo', Validators.required],
      initial_reading: [1, [Validators.required, Validators.min(1)]],
      installation_date: [new Date(), Validators.required],
      user_id: [null, Validators.required],
      assignment_date: [new Date(), Validators.required]
    });
  }

  ngOnInit() {
    this.setupColumns();
    this.setupActions();
    this.loadInitialData();
    this.setupTypeListener();
  }

  setupTypeListener() {
    this.quickSetupForm.get('type')?.valueChanges.subscribe(() => {
      this.generateMeterCode();
    });
  }

  generateMeterCode() {
    const type = this.quickSetupForm.get('type')?.value || 'consumo';
    const typeInitial = type === 'riego' ? 'R' : 'C';
    const year = new Date().getFullYear().toString().substring(2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `M${typeInitial}-${year}-${random}`;
    this.quickSetupForm.patchValue({ code });
  }

  setupColumns() {
    this.cols = [
      { field: 'meter_code', header: 'Código Medidor' },
      {
        field: 'meter_type',
        header: 'Tipo Servicio',
        type: 'tag',
        tagSeverity: (val: string) => val?.toLowerCase() === 'riego' ? 'warn' : 'info'
      },
      { field: 'assignment_date_display', header: 'Fecha Vinculación' },
      { field: 'removal_date_display', header: 'Fecha Retiro' },
      {
        field: 'status_display',
        header: 'Estado',
        type: 'tag',
        tagSeverity: (val: string) => val === 'ACTIVO' ? 'success' : 'secondary'
      }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Retirar',
        icon: 'pi pi-trash',
        styleClass: 'p-button-text p-button-danger',
        tooltip: 'Retirar medidor',
        command: (row: any) => {
          if (row.assigned) {
            this.removeMeter(row);
          }
        }
      }
    ];
  }

  loadInitialData() {
    this.loading = true;
    forkJoin({
      users: this.userService.getUsers(),
      available: this.meterHistoryService.getAvailableMeters()
    }).subscribe({
      next: (res: any) => {
        this.users = res.users;
        this.filteredUsers = res.users; // Initialize filtered list
        this.availableMeters = res.available;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => (this.loading = false)
    });
  }

  onSearch(event?: any) {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(u =>
        u.first_name.toLowerCase().includes(term) ||
        u.last_name.toLowerCase().includes(term) ||
        u.national_id.includes(term)
      );
    }
  }

  loadAvailableMeters() {
    this.meterHistoryService.getAvailableMeters().subscribe({
      next: (meters: Meter[]) => {
        this.availableMeters = meters;
        this.cdr.detectChanges();
      }
    });
  }

  onUserSelect(user: User) {
    if (!user) return;
    this.selectedUser = user;
    this.loadUserAssignments(user.user_id!);
  }

  loadUserAssignments(userId: number) {
    this.loadingAssignments = true;
    this.userAssignments = [];
    this.meterHistoryService.getAssignmentsByUser(userId).subscribe({
      next: (assignments: MeterHistory[]) => {
        this.userAssignments = assignments.map(a => ({
          ...a,
          assignment_date_display: a.assignment_date ? a.assignment_date.substring(0, 10) : '-',
          removal_date_display: a.removal_date ? a.removal_date.substring(0, 10) : '-',
          status_display: a.assigned ? 'ACTIVO' : 'RETIRADO'
        }));
        this.loadingAssignments = false;
        this.cdr.detectChanges();
      },
      error: () => (this.loadingAssignments = false)
    });
  }

  openAssignDialog() {
    if (!this.selectedUser) return;

    this.loading = true;
    this.meterHistoryService.getAvailableMeters().subscribe({
      next: (meters) => {
        this.availableMeters = meters;
        this.loading = false;
        this.assignmentForm.reset({
          user_id: this.selectedUser?.user_id,
          meter_id: null,
          assignment_date: new Date(),
          assigned: true
        });
        this.displayDialog = true;
        this.cdr.detectChanges();
      },
      error: () => (this.loading = false)
    });
  }

  openQuickSetupDialog() {
    if (!this.selectedUser) return;
    this.quickSetupForm.reset({
      type: 'consumo',
      initial_reading: 1,
      installation_date: new Date(),
      assignment_date: new Date(),
      user_id: this.selectedUser.user_id
    });
    this.generateMeterCode();
    this.displayQuickDialog = true;
    this.cdr.detectChanges();
  }

  saveQuickSetup() {
    if (this.quickSetupForm.invalid) return;

    const formValue = this.quickSetupForm.getRawValue();

    // Formatear fechas para MySQL
    if (formValue.installation_date instanceof Date) {
      formValue.installation_date = this.formatDate(formValue.installation_date);
    }
    if (formValue.assignment_date instanceof Date) {
      formValue.assignment_date = this.formatDate(formValue.assignment_date);
    }

    this.meterHistoryService.createAndAssignMeter(formValue).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Medidor creado y vinculado correctamente' });
        this.displayQuickDialog = false;
        this.loadAvailableMeters();
        if (this.selectedUser?.user_id) {
          this.loadUserAssignments(this.selectedUser.user_id);
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo crear y vincular' });
      }
    });
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }

  saveAssignment() {
    if (this.assignmentForm.invalid) return;

    // Se coge tal cual está sin formatos adicionales
    const formValue = this.assignmentForm.value;

    this.meterHistoryService.assignMeter(formValue).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Medidor asignado correctamente' });
        this.displayDialog = false;
        this.loadAvailableMeters();
        if (this.selectedUser?.user_id) {
          this.loadUserAssignments(this.selectedUser.user_id);
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo asignar el medidor' });
      }
    });
  }

  removeMeter(assignment: MeterHistory) {
    this.confirmationService.confirm({
      message: `¿Está seguro de retirar el medidor ${assignment.meter_code} del usuario?`,
      header: 'Confirmar Retiro',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Retirar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.meterHistoryService.removeAssignment(assignment.assignment_id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Medidor retirado del usuario' });
            this.loadAvailableMeters();
            if (this.selectedUser?.user_id) {
              this.loadUserAssignments(this.selectedUser.user_id);
            }
          }
        });
      }
    });
  }
}
