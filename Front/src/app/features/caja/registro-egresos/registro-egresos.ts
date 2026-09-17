import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
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
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FinancialService } from '../../../core/services/financial.service';
import { ExpenseCategoryService } from '../../../core/services/expense-category.service';
import { BankAccountsService, BankAccount } from '../../../core/services/bank-accounts.service';
import { Expense, ExpenseCategory } from '../../../core/models/financial.model';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';
import { parseLocalDate } from '../../../shared/utils/date-utils';

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
    ToastModule,
    CardModule,
    TagModule,
    TooltipModule,
    CustomTable
  ],
  providers: [MessageService],
  templateUrl: './registro-egresos.html',
  styleUrl: './registro-egresos.css',
})
export class RegistroEgresos implements OnInit {
  private financialService = inject(FinancialService);
  private categoryService = inject(ExpenseCategoryService);
  private bankAccountService = inject(BankAccountsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  expenses$!: Observable<any[]>;
  categories: any[] = [];
  
  // Balances
  balanceData: any = { global: 0, cash: 0, accounts: [] };
  activeAccounts: any[] = [];
  
  get currentSelectedBalance(): number {
    const method = this.expenseForm.get('payment_method')?.value;
    if (method === 'cash' || method === 'cash_to_bank') {
      return this.balanceData.cash || 0;
    } else {
      const accountId = this.expenseForm.get('account_id')?.value;
      if (!accountId) return 0;
      const acc = this.balanceData.accounts.find((a: any) => a.account_id === accountId);
      return acc ? acc.current_balance : 0;
    }
  }

  cols: any[] = [];
  actions: TableAction[] = [];
  get filterLabel(): string {
    if (!this.filterDates || !this.filterDates[0] || !this.filterDates[1]) return 'Todo el tiempo';
    return `${this.filterDates[0].toLocaleDateString()} al ${this.filterDates[1].toLocaleDateString()}`;
  }

  get isDateOutOfFilter(): boolean {
    const selectedDate = this.expenseForm.get('expense_date')?.value;
    if (!selectedDate || !this.filterDates || !this.filterDates[0] || !this.filterDates[1]) return false;

    const d = new Date(selectedDate);
    const start = new Date(this.filterDates[0]);
    const end = new Date(this.filterDates[1]);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return d < start || d > end;
  }

  displayDialog: boolean = false;
  dialogTitle: string = 'Registrar Nuevo Egreso';

  expenseForm: FormGroup = this.fb.group({
    expense_id: [null],
    category_id: [null, Validators.required],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    expense_date: [new Date(), Validators.required],
    description: [''],
    payment_method: ['cash'],
    account_id: [null],
    reference_number: ['']
  });

  paymentMethods = [
    { label: 'EFECTIVO', value: 'cash' },
    { label: 'TRANSFERENCIA', value: 'transfer' },
    { label: 'DEPÓSITO', value: 'deposit' },
    { label: 'DEPÓSITO A BANCO (DESDE EFECTIVO)', value: 'cash_to_bank' }
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
    this.loadAccounts();
    this.loadExpenses();
  }

  loadBalance() {
    this.financialService.getBalance().subscribe(res => {
      this.balanceData = res.balance; // asumiendo que backend retorna { global, cash, accounts } en res.balance
      this.cdr.detectChanges();
    });
  }

  loadAccounts() {
    this.bankAccountService.getActiveAccounts().subscribe(accs => {
      this.activeAccounts = accs.map(a => ({ 
        label: `${a.bank_name} - ${a.account_number}`, 
        value: a.account_id 
      }));
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe(cats => {
      this.categories = cats.map(c => ({ label: c.name.toUpperCase(), value: c.category_id }));
    });
  }

  loadExpenses() {
    const getMethodDisplay = (e: any) => {
      if (e.payment_method === 'cash') {
        return e.account_id ? 'DEP. BANCO' : 'EFECTIVO';
      }
      if (e.payment_method === 'transfer') return 'TRANSFERENCIA';
      if (e.payment_method === 'deposit') return 'DEPÓSITO';
      return e.payment_method?.toUpperCase();
    };

    this.expenses$ = this.financialService.getExpenses().pipe(
      map(expenses => {
        if (!this.filterDates || !this.filterDates[0] || !this.filterDates[1]) {
          return expenses.map(e => ({
            ...e,
            amount_display: `$${parseFloat(e.amount.toString()).toFixed(2)}`,
            date_display: new Date(e.expense_date).toLocaleDateString(),
            payment_method_display: getMethodDisplay(e)
          }));
        }

        const start = new Date(this.filterDates[0]);
        const end = new Date(this.filterDates[1]);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return expenses.filter(e => {
          const d = parseLocalDate(e.expense_date);
          return d >= start && d <= end;
        }).map(e => ({
          ...e,
          amount_display: `$${parseFloat(e.amount.toString()).toFixed(2)}`,
          date_display: parseLocalDate(e.expense_date).toLocaleDateString(),
          payment_method_display: getMethodDisplay(e)
        }));
      })
    );
  }

  setupColumns() {
    this.cols = [
      { field: 'date_display', header: 'FECHA' },
      { field: 'category_name', header: 'CATEGORÍA' },
      { field: 'description', header: 'DESCRIPCIÓN' },
      { field: 'payment_method_display', header: 'MÉTODO' },
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
      payment_method: 'cash',
      account_id: null
    });
    this.dialogTitle = 'Registrar Nuevo Egreso';
    this.displayDialog = true;
  }

  onEdit(expense: any) {
    let method = expense.payment_method;
    if (expense.payment_method === 'cash' && expense.account_id) {
      method = 'cash_to_bank';
    }
    this.expenseForm.patchValue({
      ...expense,
      payment_method: method,
      expense_date: parseLocalDate(expense.expense_date)
    });
    this.dialogTitle = 'Editar Egreso';
    this.displayDialog = true;
  }

  onDelete(expense: Expense) {
    this.confirmationService.confirm({
      message: `¿Está seguro de anular este egreso de $${expense.amount}? El motivo quedará registrado.`,
      header: 'Anular egreso',
      inputLabel: 'Motivo de la anulación',
      inputMinLength: 5,
      acceptLabel: 'Anular egreso',
      accept: (reason) => {
        if (!reason || reason.trim().length < 5) return;
        this.financialService.deleteExpense(expense.expense_id!, reason.trim()).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Egreso anulado' });
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
    
    if (rawData.payment_method === 'cash_to_bank' && !rawData.account_id) {
      this.messageService.add({severity:'error', summary:'Error', detail:'Debe seleccionar la cuenta bancaria de destino'});
      return;
    }
    if (rawData.payment_method !== 'cash' && rawData.payment_method !== 'cash_to_bank' && !rawData.account_id) {
      this.messageService.add({severity:'error', summary:'Error', detail:'Debe seleccionar una cuenta bancaria'});
      return;
    }

    const expenseId = rawData.expense_id;
    const paymentMethodDb = rawData.payment_method === 'cash_to_bank' ? 'cash' : rawData.payment_method;
    const accountIdDb = (paymentMethodDb === 'cash' && rawData.payment_method !== 'cash_to_bank') ? null : rawData.account_id;

    const expenseData: Expense = {
      ...rawData,
      payment_method: paymentMethodDb,
      account_id: accountIdDb,
      description: (rawData.description ?? '').trim().toUpperCase(),
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

        // Verificar si la fecha está fuera del filtro actual
        if (this.filterDates && this.filterDates[0] && this.filterDates[1]) {
          const expenseDate = parseLocalDate(expenseData.expense_date);
          const start = new Date(this.filterDates[0]);
          const end = new Date(this.filterDates[1]);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          if (expenseDate < start || expenseDate > end) {
            setTimeout(() => {
              this.messageService.add({
                severity: 'info',
                summary: 'Nota',
                detail: 'El registro se guardó pero no se muestra porque está fuera del rango seleccionado.',
                life: 6000
              });
            }, 500);
          }
        }

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
