import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { OtherIncome, OtherIncomesService } from '../../../core/services/other-incomes.service';
import { BankAccountsService, BankAccount } from '../../../core/services/bank-accounts.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-ingresos-extraordinarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomTable, DialogModule, ButtonModule, InputNumberModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './ingresos-extra.html'
})
export class IngresosExtraordinarios implements OnInit {
  incomes: any[] = [];
  columns: any[] = [];
  actions: TableAction[] = [];
  isSaving = false;
  
  showForm = false;
  form: FormGroup;
  
  activeAccounts: any[] = [];
  paymentMethods = [
    { label: 'Efectivo', value: 'cash' },
    { label: 'Transferencia', value: 'transfer' },
    { label: 'Depósito', value: 'deposit' }
  ];

  constructor(
    private incomesService: OtherIncomesService,
    private messages: MessageService,
    private bankAccountService: BankAccountsService,
    private fb: FormBuilder,
    private confirmationService: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      income_date: [new Date().toISOString().split('T')[0], Validators.required],
      description: ['', Validators.required],
      payment_method: ['cash', Validators.required],
      account_id: [null],
      reference_number: ['']
    });
  }

  ngOnInit(): void {
    this.setupTable();
    setTimeout(() => {
      this.loadIncomes();
      this.loadAccounts();
    }, 0);
  }
  
  loadAccounts() {
    this.bankAccountService.getActiveAccounts().subscribe(accs => {
      this.activeAccounts = accs.map(a => ({ 
        label: `${a.bank_name} - ${a.account_number}`, 
        value: a.account_id 
      }));
    });
  }

  setupTable() {
    this.columns = [
      { field: 'income_date', header: 'Fecha', type: 'date' },
      { field: 'description', header: 'Descripción / Concepto' },
      { field: 'amount', header: 'Monto ($)' },
      { field: 'payment_method', header: 'Método' }
    ];
    this.actions = [{
      icon: 'pi pi-ban',
      tooltip: 'Anular ingreso',
      styleClass: 'p-button-danger',
      command: (row: any) => this.voidIncome(row)
    }];
  }

  loadIncomes() {
    this.incomesService.getAll().subscribe(data => {
      this.incomes = data.map(item => ({
        ...item,
        income_date: item.income_date ? item.income_date.split('T')[0] : '',
        amount: Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }));
      this.cdr.detectChanges();
    });
  }

  onSubmit(event: Event) {
    if (this.form.invalid) return;
    
    if (this.form.value.payment_method !== 'cash' && !this.form.value.account_id) {
      this.messages.add({severity:'warn', summary:'Atención', detail:'Debe seleccionar una cuenta bancaria'});
      return;
    }
    
    if (this.form.valid) {
      this.confirmationService.confirm({
        message: '¿Está seguro de registrar este ingreso? Después solo podrá anularse con un motivo y fuera de períodos cerrados.',
        header: 'Confirmación de Ingreso',
        acceptLabel: 'Registrar ingreso',
        rejectLabel: 'Cancelar',
        accept: () => {
          if (this.isSaving) return;
          this.isSaving = true;
          this.incomesService.create(this.form.value).subscribe({
            next: () => {
              this.isSaving = false;
              this.loadIncomes();
              this.showForm = false;
              this.form.reset({
                amount: null,
                payment_method: 'cash',
                income_date: new Date().toISOString().split('T')[0]
              });
            },
            error: err => {
              this.isSaving = false;
              this.messages.add({severity:'error', summary:'Error', detail:err.error?.message || err.error?.error || 'Error al registrar ingreso'});
            }
          });
        }
      });
    }
  }

  voidIncome(income: any) {
    this.confirmationService.confirm({
      header: 'Anular ingreso',
      message: 'Indique por qué desea anular este ingreso. El motivo quedará registrado.',
      inputLabel: 'Motivo de la anulación',
      inputMinLength: 5,
      acceptLabel: 'Anular ingreso',
      rejectLabel: 'Cancelar',
      accept: reason => {
        if (!reason || reason.trim().length < 5) return;
        this.incomesService.voidIncome(income.income_id, reason.trim()).subscribe({
          next: () => {
            this.loadIncomes();
            this.messages.add({severity:'success', summary:'Ingreso anulado', detail:'Ingreso anulado correctamente'});
          },
          error: err => this.messages.add({severity:'error', summary:'Error', detail:err.error?.message || err.error?.error || 'No fue posible anular el ingreso'})
        });
      }
    });
  }
}
