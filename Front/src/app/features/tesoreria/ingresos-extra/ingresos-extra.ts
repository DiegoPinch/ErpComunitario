import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { OtherIncome, OtherIncomesService } from '../../../core/services/other-incomes.service';
import { BankAccountsService, BankAccount } from '../../../core/services/bank-accounts.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';

@Component({
  selector: 'app-ingresos-extraordinarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomTable, ConfirmDialogModule, DialogModule, ButtonModule, InputNumberModule, SelectModule],
  providers: [ConfirmationService],
  templateUrl: './ingresos-extra.html'
})
export class IngresosExtraordinarios implements OnInit {
  incomes: any[] = [];
  columns: any[] = [];
  
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
    private bankAccountService: BankAccountsService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
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
      alert('Debe seleccionar una cuenta bancaria');
      return;
    }
    
    if (this.form.valid) {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: '¿Está seguro de registrar este ingreso? Por seguridad, una vez guardado no se podrá borrar ni editar.',
        header: 'Confirmación de Ingreso',
        icon: 'pi pi-exclamation-triangle',
        acceptIcon: 'none',
        rejectIcon: 'none',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => {
          this.incomesService.create(this.form.value).subscribe({
            next: () => {
              this.loadIncomes();
              this.showForm = false;
              this.form.reset({
                amount: null,
                payment_method: 'cash',
                income_date: new Date().toISOString().split('T')[0]
              });
            },
            error: () => {
              alert('Error al registrar ingreso');
            }
          });
        }
      });
    }
  }
}
