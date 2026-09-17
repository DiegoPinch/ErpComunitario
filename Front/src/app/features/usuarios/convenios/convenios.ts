import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { PaymentAgreementsService, PaymentAgreement } from '../../../core/services/payment-agreements';
import { BankAccountsService, BankAccount } from '../../../core/services/bank-accounts.service';
import { UserService } from '../../../core/services/user.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-convenios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomTable, SelectModule, InputNumberModule, DialogModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './convenios.html',
  styleUrls: ['./convenios.css']
})
export class Convenios implements OnInit {
  agreements: any[] = [];
  users: any[] = [];
  columns: any[] = [];
  actions: TableAction[] = [];
  
  showForm = false;

  onDebtAmountFocus(event: Event) {
    const input = event.target as HTMLInputElement;
    setTimeout(() => {
      if (document.activeElement === input) input.select();
    });
  }

  isCreating = false;
  isVoiding = false;
  createError = '';
  showPaymentForm = false;
  selectedDebtId: number | null = null;
  selectedDebtName = '';
  selectedAgreementId: number | null = null;
  isPaymentSubmitting = false;
  form: FormGroup;
  paymentForm: FormGroup;
  
  activeAccounts: any[] = [];
  paymentMethods = [
    { label: 'Efectivo', value: 'cash' },
    { label: 'Transferencia', value: 'transfer' },
    { label: 'Depósito', value: 'deposit' }
  ];

  constructor(
    private agreementsService: PaymentAgreementsService,
    private bankAccountService: BankAccountsService,
    private userService: UserService,
    private fb: FormBuilder,
    private confirmService: ConfirmService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      user_id: ['', Validators.required],
      description: ['', Validators.required],
      total_amount: ['', [Validators.required, Validators.min(0.01)]]
    });

    this.paymentForm = this.fb.group({
      amount_paid: ['', [Validators.required, Validators.min(0.01)]],
      payment_method: ['cash'],
      account_id: [null],
      reference_number: ['']
    });
  }

  ngOnInit(): void {
    this.setupTable();
    this.loadUsers();
    this.loadAccounts();
    // Use setTimeout to ensure change detection cycles if there are double-click issues
    setTimeout(() => this.loadAgreements(), 0);
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
      { field: 'client_name', header: 'Cliente' },
      { field: 'description', header: 'Concepto' },
      { field: 'total_amount', header: 'Deuda Total ($)' },
      { field: 'remaining_amount', header: 'Faltante ($)' },
      { field: 'status_label', header: 'Estado' }
    ];

    this.actions = [
      {
        icon: 'pi pi-money-bill',
        tooltip: 'Abonar',
        styleClass: 'p-button-success',
        command: (row: any) => this.openPaymentModal(row)
      },
      {
        icon: 'pi pi-history',
        tooltip: 'Historial',
        styleClass: 'p-button-info',
        command: (row: any) => this.openHistoryModal(row)
      }
    ];
  }

  loadAgreements() {
    this.agreementsService.getAll().subscribe(data => {
      this.agreements = data.map(item => ({
        ...item,
        client_name: `${item.last_name} ${item.first_name}`,
        status_label: item.status === 'active' ? 'ACTIVO' : 'PAGADO',
        total_amount: Number(item.total_amount).toFixed(2),
        remaining_amount: Number(item.remaining_amount).toFixed(2)
      }));
      this.cdr.detectChanges();
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe(data => {
      this.users = data.map(user => ({
        ...user,
        display_name: `${user.last_name} ${user.first_name}`
      }));
    });
  }

  openCreateModal() {
    if (this.isCreating) return;
    this.form.reset({ user_id: '', description: '', total_amount: '' });
    this.createError = '';
    this.showForm = true;
  }

  onSubmit() {
    if (this.form.invalid || this.isCreating) return;
    this.isCreating = true;
    this.createError = '';
    this.agreementsService.create(this.form.value).subscribe({
      next: () => {
        this.isCreating = false;
        this.showForm = false;
        this.form.reset();
        this.loadAgreements();
      },
      error: err => {
        this.isCreating = false;
        this.createError = err.error?.message || err.error?.error || 'No se pudo guardar la deuda. Revise los datos.';
        this.cdr.detectChanges();
      }
    });
  }

  openPaymentModal(row: any) {
    if (row.status === 'completed') {
      this.notify('info', 'Esta deuda ya está pagada.');
      return;
    }
    this.selectedDebtId = row.agreement_id;
    this.selectedDebtName = `${row.description} - Faltante: $${row.remaining_amount}`;
    this.paymentForm.reset({
      payment_method: 'cash',
      account_id: null,
      reference_number: ''
    });
    this.showPaymentForm = true;
  }

  onPaymentSubmit() {
    if (this.paymentForm.invalid || this.isPaymentSubmitting) return;
    
    if (this.paymentForm.value.payment_method !== 'cash' && !this.paymentForm.value.account_id) {
      this.notify('warn', 'Debe seleccionar una cuenta bancaria');
      return;
    }

    if (this.paymentForm.valid && this.selectedDebtId) {
      this.isPaymentSubmitting = true;
      const { amount_paid, payment_method, account_id, reference_number } = this.paymentForm.value;
      this.agreementsService.addDebtPayment(this.selectedDebtId, amount_paid, payment_method, account_id, reference_number).subscribe({
        next: (res) => {
          this.notify('success', 'Abono registrado correctamente. Nuevo saldo: $' + res.remaining);
          this.showPaymentForm = false;
          this.loadAgreements();
          if (res.debt_payment_id) {
             this.agreementsService.printReceipt(res.debt_payment_id).subscribe();
          }
          this.isPaymentSubmitting = false;
        },
        error: (err) => {
          this.isPaymentSubmitting = false;
          this.notify('error', err.error?.message || err.error?.error || 'Error al registrar abono');
        }
      });
    }
  }

  // Historial de Pagos
  showHistoryModal = false;
  historyPayments: any[] = [];
  rawPaymentInput = '';

  get formattedPaymentAmount(): string {
    if (this.rawPaymentInput !== '') {
      return this.rawPaymentInput;
    }
    const val = this.paymentForm.get('amount_paid')?.value;
    return val ? Number(val).toFixed(2) : '';
  }

  onPaymentAmountInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;
    
    let cleanValue = value.replace(/,/g, '.');
    cleanValue = cleanValue.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > 2) {
      cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    let amount = parseFloat(cleanValue);
    if (isNaN(amount) || amount < 0) {
      amount = 0;
    }
    
    this.rawPaymentInput = cleanValue;
    this.paymentForm.get('amount_paid')?.setValue(amount);
    inputElement.value = cleanValue;
  }

  onPaymentAmountBlur(event: Event) {
    this.rawPaymentInput = '';
    const val = this.paymentForm.get('amount_paid')?.value;
    const inputElement = event.target as HTMLInputElement;
    inputElement.value = val ? Number(val).toFixed(2) : '0.00';
    this.cdr.detectChanges();
  }
  
  openHistoryModal(row: any) {
    this.selectedAgreementId = row.agreement_id;
    this.selectedDebtName = `${row.description} - Historial de Abonos`;
    this.agreementsService.getDebtPayments(row.agreement_id).subscribe(payments => {
      this.historyPayments = payments;
      this.showHistoryModal = true;
      this.cdr.detectChanges();
    });
  }

  printHistoryTicket(payment: any) {
    this.agreementsService.printReceipt(payment.debt_payment_id).subscribe();
  }

  voidHistoryPayment(payment: any) {
    if (this.isVoiding) return;
    const agreementId = this.selectedAgreementId;
    this.confirmService.confirm({
      header: 'Anular abono',
      message: `¿Desea anular el abono de $${Number(payment.amount_paid).toFixed(2)}? El valor volverá al saldo pendiente de la deuda.`,
      inputLabel: 'Motivo de la anulación',
      inputMinLength: 5,
      acceptLabel: 'Anular abono',
      rejectLabel: 'Cancelar',
      accept: reason => {
        if (!reason || reason.trim().length < 5 || this.isVoiding) return;
        this.isVoiding = true;
    this.agreementsService.voidDebtPayment(payment.debt_payment_id, reason).subscribe({
      next: () => {
        this.isVoiding = false;
        if (agreementId && agreementId === this.selectedAgreementId) {
          this.agreementsService.getDebtPayments(agreementId).subscribe(items => {
            if (agreementId === this.selectedAgreementId) this.historyPayments = items;
            this.cdr.detectChanges();
          });
        }
        this.loadAgreements();
        this.notify('success', 'Abono anulado y saldo restaurado correctamente');
      },
      error: err => {
        this.isVoiding = false;
        this.notify('error', err.error?.message || err.error?.error || 'No fue posible anular el abono');
      }
    });
      }
    });
  }

  private notify(severity: 'info' | 'warn' | 'success' | 'error', detail: string) {
    this.messageService.add({severity, summary: severity === 'error' ? 'Error' : 'Cuentas por cobrar', detail});
  }
}
