import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, map, forkJoin, of } from 'rxjs';
import { AdditionalConceptsService } from '../../../core/services/additional-concepts.service';
import { InvoicesService, UserPendingSummary, Invoice } from '../../../core/services/invoices.service';
import { AdditionalConcept } from '../../../core/models/additional-concept.interface';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-rubros-lista',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CustomTable,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './rubros-lista.html',
  styleUrl: './rubros-lista.css',
})
export class RubrosLista implements OnInit {
  private conceptsService = inject(AdditionalConceptsService);
  private invoicesService = inject(InvoicesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  concepts$!: Observable<any[]>;
  cols: any[] = [];
  actions: TableAction[] = [];
  assignedUsersCols: any[] = [];
  assignedUsersActions: TableAction[] = [];

  selectedConcept: AdditionalConcept | null = null;

  // Dialogs
  conceptDialog: boolean = false;
  assignDialog: boolean = false;
  assignedUsersDialog: boolean = false;

  // Form Model
  conceptForm: FormGroup = this.fb.group({
    concept_id: [null],
    description: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    applies_to: ['all', Validators.required],
    application_month: ['', Validators.required],
    status: [true]
  });

  // Assignment Logic
  pendingUsers: UserPendingSummary[] = [];
  selectedUser: UserPendingSummary | null = null;
  userInvoices: any[] = [];
  assignedUsers: any[] = [];

  appliesOptions = [
    { label: 'Todos (Global)', value: 'all' },
    { label: 'Usuario Específ.', value: 'user' }
  ];

  availableMonths: { label: string, value: string }[] = [];

  ngOnInit(): void {
    this.setupColumns();
    this.setupActions();
    this.setupAssignedUsersTable();
    this.loadConcepts();
    this.generateAvailableMonths();
  }

  loadConcepts() {
    this.concepts$ = this.conceptsService.getConcepts().pipe(
      map(concepts => concepts.map(c => ({
        ...c,
        amount_display: `$${c.amount.toFixed(2)}`,
        month_display: this.formatMonth(c.application_month),
        type_display: c.applies_to === 'all' ? 'GLOBAL' : 'INDIVIDUAL'
      })))
    );
  }

  setupColumns() {
    this.cols = [
      { field: 'description', header: 'Descripción' },
      {
        field: 'type_display',
        header: 'Tipo',
        type: 'tag',
        tagSeverity: (val: string) => val === 'GLOBAL' ? 'info' : 'warn'
      },
      { field: 'month_display', header: 'Mes Aplicación' },
      { field: 'amount_display', header: 'Monto' }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Ver Asignados',
        icon: 'pi pi-users',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Ver Usuarios Asignados',
        command: (row: AdditionalConcept) => this.openAssignedUsers(row)
      },
      {
        label: 'Asignar',
        icon: 'pi pi-user-plus',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Asignar a Usuarios',
        command: (row: AdditionalConcept) => this.openAssign(row)
      },
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Editar Rubro',
        command: (row: AdditionalConcept) => this.editConcept(row)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'p-button-text p-button-danger',
        tooltip: 'Eliminar Rubro',
        command: (row: AdditionalConcept) => this.deleteConcept(row)
      }
    ];
  }

  setupAssignedUsersTable() {
    this.assignedUsersCols = [
      { field: 'user_name', header: 'Usuario' },
      { field: 'national_id', header: 'Cédula' },
      { field: 'invoice_id_display', header: 'Factura' },
      {
        field: 'status_label',
        header: 'Estado',
        type: 'tag',
        tagSeverity: (val: string) => val === 'COBRADA' ? 'success' : 'warn'
      }
    ];

    this.assignedUsersActions = [
      {
        icon: 'pi pi-trash',
        styleClass: 'p-button-danger',
        tooltip: 'Quitar Rubro',
        command: (row: any) => {
          if (row.invoice_status === 'paid') {
            this.showError('No se puede quitar el rubro de una factura cobrada');
            return;
          }
          this.removeAssignedUser(row);
        }
      }
    ];
  }

  generateAvailableMonths() {
    const now = new Date();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    this.availableMonths = [];

    // Generamos únicamente: Mes Anterior y Mes Actual
    for (let i = -1; i <= 0; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');

      this.availableMonths.push({
        label: `${monthNames[d.getMonth()]} ${year}`,
        value: `${year}-${monthNum}`
      });
    }
  }

  openNew() {
    this.conceptForm.reset({
      applies_to: 'all',
      status: true
    });
    this.conceptDialog = true;
  }

  editConcept(concept: AdditionalConcept) {
    this.conceptForm.patchValue(concept);
    this.conceptDialog = true;
  }

  saveConcept() {
    if (this.conceptForm.invalid) {
      this.conceptForm.markAllAsTouched();
      return;
    }

    const conceptData = this.conceptForm.getRawValue();
    const conceptId = conceptData.concept_id;

    if (conceptId) {
      this.conceptsService.updateConcept(conceptId, conceptData).subscribe({
        next: () => {
          this.showSuccess('Concepto actualizado y totales recalculados');
          this.loadConcepts();
          this.conceptDialog = false;
        },
        error: (err) => this.showError(err.error?.message || 'Error al actualizar')
      });
    } else {
      this.conceptsService.createConcept(conceptData).subscribe({
        next: () => {
          this.showSuccess('Concepto creado y aplicado (si es global)');
          this.loadConcepts();
          this.conceptDialog = false;
        },
        error: (err) => this.showError(err.error?.message || 'Error al crear')
      });
    }
  }

  deleteConcept(concept: AdditionalConcept) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar "${concept.description}"? Se eliminará de todas las facturas PENDIENTES.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (concept.concept_id) {
          this.conceptsService.deleteConcept(concept.concept_id).subscribe({
            next: () => {
              this.showSuccess('Concepto eliminado');
              this.loadConcepts();
            },
            error: (err) => {
              this.showError(err.error?.message || 'No se puede eliminar este rubro');
            }
          });
        }
      }
    });
  }

  // --- Assignment Logic ---
  openAssign(concept: AdditionalConcept) {
    this.selectedConcept = concept;
    this.selectedUser = null;
    this.userInvoices = [];
    this.loadPendingUsers();
    // Deferimos la apertura para evitar NG0100
    setTimeout(() => {
      this.assignDialog = true;
      this.cdr.detectChanges();
    });
  }

  loadPendingUsers() {
    this.invoicesService.getPendingUsers().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.pendingUsers = data;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onUserSelect() {
    if (this.selectedUser) {
      this.invoicesService.getUserInvoices(this.selectedUser.user_id).subscribe({
        next: (invoices) => {
          const targetInvoices = invoices.filter(inv =>
            inv.billing_month === this.selectedConcept?.application_month
          );

          if (targetInvoices.length === 0) {
            setTimeout(() => {
              this.userInvoices = [];
              this.messageService.add({
                severity: 'info',
                summary: 'Info',
                detail: 'Este usuario no tiene facturas en el mes seleccionado.'
              });
              this.cdr.detectChanges();
            });
            return;
          }

          // Verificamos vinculación para cada factura
          const checks = targetInvoices.map(inv =>
            this.invoicesService.getInvoiceDetails(inv.invoice_id).pipe(
              map(details => ({
                ...inv,
                is_linked: details.concepts?.some((c: any) => c.description === this.selectedConcept?.description)
              }))
            )
          );

          forkJoin(checks).subscribe(results => {
            setTimeout(() => {
              this.userInvoices = results;
              this.cdr.detectChanges();
            });
          });
        }
      });
    }
  }

  assignToInvoice(invoice: any) {
    if (!this.selectedConcept?.concept_id) return;

    this.conceptsService.linkConceptToInvoice(invoice.invoice_id, this.selectedConcept.concept_id).subscribe({
      next: () => {
        this.showSuccess('Rubro asignado correctamente');
        this.assignDialog = false;
        this.loadConcepts();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Error al asignar rubro');
      }
    });
  }

  openAssignedUsers(concept: AdditionalConcept) {
    this.selectedConcept = concept;
    this.loadAssignedUsers();
    // Deferimos la apertura para evitar NG0100
    setTimeout(() => {
      this.assignedUsersDialog = true;
      this.cdr.detectChanges();
    });
  }

  loadAssignedUsers() {
    if (!this.selectedConcept?.concept_id) return;
    this.conceptsService.getAssignedUsers(this.selectedConcept.concept_id).subscribe({
      next: (users) => {
        setTimeout(() => {
          this.assignedUsers = users.map((u: any) => ({
            ...u,
            invoice_id_display: `#${u.invoice_id}`,
            status_label: u.invoice_status === 'paid' ? 'COBRADA' : 'PENDIENTE'
          }));
          this.cdr.detectChanges();
        });
      }
    });
  }

  removeAssignedUser(userLink: any) {
    this.confirmationService.confirm({
      message: `¿Está seguro de quitar este rubro a ${userLink.user_name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.conceptsService.unlinkConcept(userLink.invoice_concept_id).subscribe({
          next: () => {
            this.showSuccess('Rubro quitado correctamente');
            this.loadAssignedUsers();
          },
          error: (err) => this.showError(err.error?.message || 'No se pudo quitar el rubro')
        });
      }
    });
  }

  formatMonth(month: string | undefined): string {
    if (!month) return '';
    const [year, m] = month.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(m) - 1]} ${year}`;
  }

  private showSuccess(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
  }

  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Atención', detail: msg, life: 5000 });
  }
}
