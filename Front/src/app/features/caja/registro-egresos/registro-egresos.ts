import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FinancialService } from '../../../core/services/financial.service';
import { ExpenseCategoryService } from '../../../core/services/expense-category.service';
import { Expense, ExpenseCategory } from '../../../core/models/financial.model';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-registro-egresos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    SelectModule,
    TextareaModule,
    ConfirmDialogModule,
    ToastModule,
    CardModule,
    TagModule,
    TooltipModule,
    CustomTable
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './registro-egresos.html',
  styleUrl: './registro-egresos.css',
})
export class RegistroEgresos implements OnInit {
  private financialService = inject(FinancialService);
  private categoryService = inject(ExpenseCategoryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  expenses$!: Observable<any[]>;
  categories: any[] = [];
  balance: number = 0;

  cols: any[] = [];
  actions: TableAction[] = [];

  displayDialog: boolean = false;
  dialogTitle: string = 'Registrar Nuevo Egreso';

  expenseForm: FormGroup = this.fb.group({
    expense_id: [null],
    category_id: [null, Validators.required],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    expense_date: [new Date(), Validators.required],
    description: ['', Validators.required],
    payment_method: ['CASH'],
    reference_number: ['']
  });

  paymentMethods = [
    { label: 'EFECTIVO', value: 'CASH' },
    { label: 'TRANSFERENCIA', value: 'TRANSFER' }
  ];

  // Filtro de rango de fechas
  filterDates: Date[] | undefined = [
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date()
  ];

  ngOnInit() {
    this.setupColumns();
    this.setupActions();
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadBalance();
    this.loadCategories();
    this.loadExpenses();
  }

  loadBalance() {
    this.financialService.getBalance().subscribe(res => {
      this.balance = res.balance;
      this.cdr.detectChanges();
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe(cats => {
      this.categories = cats.map(c => ({ label: c.name.toUpperCase(), value: c.category_id }));
    });
  }

  loadExpenses() {
    this.expenses$ = this.financialService.getExpenses().pipe(
      map(expenses => {
        if (!this.filterDates || !this.filterDates[0] || !this.filterDates[1]) {
          return expenses.map(e => ({
            ...e,
            amount_display: `$${parseFloat(e.amount.toString()).toFixed(2)}`,
            date_display: new Date(e.expense_date).toLocaleDateString()
          }));
        }

        const start = new Date(this.filterDates[0]);
        const end = new Date(this.filterDates[1]);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return expenses.filter(e => {
          const d = new Date(e.expense_date);
          return d >= start && d <= end;
        }).map(e => ({
          ...e,
          amount_display: `$${parseFloat(e.amount.toString()).toFixed(2)}`,
          date_display: new Date(e.expense_date).toLocaleDateString()
        }));
      })
    );
  }

  setupColumns() {
    this.cols = [
      { field: 'date_display', header: 'FECHA' },
      { field: 'category_name', header: 'CATEGORÍA' },
      { field: 'description', header: 'DESCRIPCIÓN' },
      { field: 'payment_method', header: 'MÉTODO' },
      { field: 'amount_display', header: 'MONTO', style: { 'text-align': 'right', 'font-weight': 'bold' } }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Editar Egreso',
        command: (row: Expense) => this.onEdit(row)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'p-button-text p-button-danger',
        tooltip: 'Eliminar Egreso',
        command: (row: Expense) => this.onDelete(row)
      }
    ];
  }

  openNew() {
    this.expenseForm.reset({
      expense_date: new Date(),
      payment_method: 'CASH'
    });
    this.dialogTitle = 'Registrar Nuevo Egreso';
    this.displayDialog = true;
  }

  onEdit(expense: any) {
    this.expenseForm.patchValue({
      ...expense,
      expense_date: new Date(expense.expense_date)
    });
    this.dialogTitle = 'Editar Egreso';
    this.displayDialog = true;
  }

  onDelete(expense: Expense) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar este egreso de $${expense.amount}? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.financialService.deleteExpense(expense.expense_id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Egreso eliminado' });
            this.loadInitialData();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al eliminar' })
        });
      }
    });
  }

  saveExpense() {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const rawData = this.expenseForm.getRawValue();
    const expenseId = rawData.expense_id;

    const expenseData: Expense = {
      ...rawData,
      description: rawData.description.toUpperCase(),
      reference_number: rawData.reference_number?.toUpperCase(),
      expense_date: this.formatDate(rawData.expense_date)
    };

    const request = expenseId
      ? this.financialService.updateExpense(expenseId, expenseData)
      : this.financialService.createExpense(expenseData);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: expenseId ? 'Egreso actualizado correctamente' : 'Egreso registrado correctamente'
        });
        this.displayDialog = false;
        this.loadInitialData();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Atención',
          detail: err.error?.error || 'Error al procesar el egreso',
          life: 5000
        });
      }
    });
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  onDateChange() {
    this.loadExpenses();
  }
}
