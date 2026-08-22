import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { PaymentAgreementsService, PaymentAgreement } from '../../../core/services/payment-agreements';
import { BankAccountsService, BankAccount } from '../../../core/services/bank-accounts.service';
import { UserService } from '../../../core/services/user.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-convenios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomTable, SelectModule],
  templateUrl: './convenios.html',
  styleUrls: ['./convenios.css']
})
export class Convenios implements OnInit {
  agreements: any[] = [];
  users: any[] = [];
  columns: any[] = [];
  actions: TableAction[] = [];
  
  showForm = false;
  showPaymentForm = false;
  selectedDebtId: number | null = null;
  selectedDebtName = '';
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
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      user_id: ['', Validators.required],
      description: ['', Validators.required],
      total_amount: ['', [Validators.required, Validators.min(1)]]
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
        client_name: `${item.last_name} ${item.first_name} (${item.national_id})`,
        status_label: item.status === 'active' ? 'ACTIVO' : 'PAGADO',
        total_amount: Number(item.total_amount).toFixed(2),
        remaining_amount: Number(item.remaining_amount).toFixed(2)
      }));
      this.cdr.detectChanges();
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe(data => {
      this.users = data;
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.agreementsService.create(this.form.value).subscribe(() => {
        this.loadAgreements();
        this.showForm = false;
        this.form.reset();
      });
    }
  }

  openPaymentModal(row: any) {
    if (row.status === 'completed') {
      alert('Esta deuda ya está pagada.');
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
    if (this.paymentForm.invalid) return;
    
    if (this.paymentForm.value.payment_method !== 'cash' && !this.paymentForm.value.account_id) {
      alert('Debe seleccionar una cuenta bancaria');
      return;
    }

    if (this.paymentForm.valid && this.selectedDebtId) {
      const { amount_paid, payment_method, account_id, reference_number } = this.paymentForm.value;
      this.agreementsService.addDebtPayment(this.selectedDebtId, amount_paid, payment_method, account_id, reference_number).subscribe({
        next: (res) => {
          alert('Abono registrado correctamente. Nuevo saldo: $' + res.remaining);
          this.showPaymentForm = false;
          this.loadAgreements();
          if (res.debt_payment_id) {
             this.agreementsService.printReceipt(res.debt_payment_id).subscribe();
          }
        },
        error: (err) => {
          alert('Error al registrar abono');
        }
      });
    }
  }

  // Historial de Pagos
  showHistoryModal = false;
  historyPayments: any[] = [];
  
  openHistoryModal(row: any) {
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
}
