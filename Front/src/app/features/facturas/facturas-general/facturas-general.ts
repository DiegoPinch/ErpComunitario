import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InvoicesService } from '../../../core/services/invoices.service';
import { PaymentAgreementsService, PaymentAgreement } from '../../../core/services/payment-agreements';
import { BankAccountsService, BankAccount } from '../../../core/services/bank-accounts.service';
import { UserPendingSummary, Invoice } from '../../../core/models/invoice.model';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-facturas-general',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ListboxModule,
    ButtonModule,
    CardModule,
    TagModule,
    InputTextModule,
    DialogModule,
    CheckboxModule,
    ToastModule,
    CustomTable,
    SelectModule
  ],
  providers: [MessageService],
  templateUrl: './facturas-general.html',
  styleUrl: './facturas-general.css'
})
export class FacturasGeneral implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private invoicesService = inject(InvoicesService);
  private agreementsService = inject(PaymentAgreementsService);
  private bankAccountService = inject(BankAccountsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmService);

  users: any[] = [];
  selectedUser: any | null = null;
  
  // Invoices
  selectedInvoices: Invoice[] = [];
  showInvoicesTable: boolean = false;
  showInvoiceDetailModal: boolean = false;
  formattedInvoices: any[] = [];

  // Debts (Cuentas por Cobrar)
  userDebts: PaymentAgreement[] = [];
  selectedDebts: { agreement: PaymentAgreement, amountToPay: number }[] = [];
  rawInputValues: { [id: number]: string } = {};

  // Propiedades para el diálogo de cobro
  showPaymentDialog: boolean = false;
  amountReceived: number | null = null;
  paymentProcessing = false;
  changeAmount: number = 0;
  totalToPay: number = 0;
  invoicesToCollect: number[] = [];
  
  paymentMethod: string = 'cash';
  accountId: number | null = null;
  referenceNumber: string = '';
  activeAccounts: any[] = [];
  paymentMethods = [
    { label: 'Efectivo', value: 'cash' },
    { label: 'Transferencia', value: 'transfer' },
    { label: 'Depósito', value: 'deposit' }
  ];

  stats = {
    total_pending: 0,
    total_amount: 0,
    users_with_debt: 0
  };

  historyColumns = [
    { field: 'invoice_id_display', header: 'ID' },
    { field: 'billing_month_display', header: 'Periodo' },
    { field: 'issue_date_display', header: 'Emisión' },
    { field: 'total_amount_display', header: 'Monto' },
    {
      field: 'status_display',
      header: 'Estado',
      type: 'tag',
      tagSeverity: (val: string) => val === 'PAGADA' ? 'success' : 'warn'
    }
  ];

  historyActions: TableAction[] = [
    {
      icon: 'pi pi-print',
      tooltip: 'Re-imprimir Ticket',
      styleClass: 'p-button-danger',
      command: (row: any) => this.downloadPDF(row.original)
    },
    {
      icon: 'pi pi-trash',
      tooltip: 'Anular Pago',
      styleClass: 'p-button-secondary',
      command: (row: any) => {
        if (row.original.status === 'paid') {
          this.onVoidPayment(row.original);
        }
      }
    }
  ];

  ngOnInit(): void {
    this.loadPendingUsers();
    this.loadAccounts();
  }

  loadAccounts() {
    this.bankAccountService.getActiveAccounts().subscribe(accs => {
      this.activeAccounts = accs.map(a => ({ 
        label: `${a.bank_name} - ${a.account_number}`, 
        value: a.account_id 
      }));
    });
  }

  loadPendingUsers() {
    this.invoicesService.getPendingUsers().subscribe(users => {
      this.users = users;
      this.calculateStats();
      this.cdr.detectChanges();
    });
  }

  calculateStats() {
    this.stats.total_pending = this.users.reduce((acc, u) => acc + (u.pending_count || 0), 0);
    this.stats.total_amount = this.users.reduce((acc, u) => acc + (parseFloat(u.total_debt) || 0), 0);
    this.stats.users_with_debt = this.users.filter(u => u.pending_count > 0).length;
  }

  onSelectUser(event: any) {
    const user = event.value;
    if (!user) {
      this.selectedUser = null;
      this.selectedInvoices = [];
      this.userDebts = [];
      this.selectedDebts = [];
      return;
    }

    // Load Invoices
    this.invoicesService.getUserInvoices(user.user_id).subscribe(invoices => {
      this.selectedUser = { ...user, invoices };
      this.prepareFormattedInvoices(invoices);
      this.selectedInvoices = [];

      const firstPending = invoices.find(i => i.status === 'pending');
      if (firstPending) {
        this.selectedInvoices = [firstPending];
        this.loadInvoiceDetailsIfNeeded(firstPending);
      }

      // Load Debts
      this.agreementsService.getByUser(user.user_id).subscribe(debts => {
        this.userDebts = debts.filter(d => d.status === 'active');
        this.selectedDebts = []; // reset
        this.cdr.detectChanges();
      });
    });
  }

  prepareFormattedInvoices(invoices: Invoice[]) {
    this.formattedInvoices = invoices.map(inv => ({
      invoice_id_display: `#${inv.invoice_id}`,
      billing_month_display: this.formatMonth(inv.billing_month),
      issue_date_display: new Date(inv.issue_date).toLocaleDateString('es-ES'),
      total_amount_display: `$${inv.total_amount.toFixed(2)}`,
      status_display: inv.status === 'paid' ? 'PAGADA' : 'PENDIENTE',
      original: inv
    }));
  }

  isSelected(invoice: Invoice): boolean {
    return this.selectedInvoices.some(i => i.invoice_id === invoice.invoice_id);
  }

  isDebtSelected(debt: PaymentAgreement): boolean {
    return this.selectedDebts.some(d => d.agreement.agreement_id === debt.agreement_id);
  }

  getDebtPaymentAmount(debt: PaymentAgreement): number {
    const found = this.selectedDebts.find(d => d.agreement.agreement_id === debt.agreement_id);
    return found ? found.amountToPay : Number(debt.remaining_amount);
  }

  onCardClick(invoice: Invoice) {
    this.selectedInvoices = [invoice];
    this.loadInvoiceDetailsIfNeeded(invoice);
    this.cdr.detectChanges();
  }

  toggleInvoiceSelection(invoice: Invoice) {
    if (this.isSelected(invoice)) {
      this.selectedInvoices = this.selectedInvoices.filter(i => i.invoice_id !== invoice.invoice_id);
    } else {
      this.selectedInvoices.push(invoice);
      this.loadInvoiceDetailsIfNeeded(invoice);
    }
    this.cdr.detectChanges();
  }

  toggleDebtSelection(debt: PaymentAgreement) {
    if (this.isDebtSelected(debt)) {
      this.selectedDebts = this.selectedDebts.filter(d => d.agreement.agreement_id !== debt.agreement_id);
      if (debt.agreement_id !== undefined) {
        delete this.rawInputValues[debt.agreement_id];
      }
    } else {
      this.selectedDebts.push({ agreement: debt, amountToPay: Number(debt.remaining_amount) });
    }
    this.cdr.detectChanges();
  }

  updateDebtAmount(debt: PaymentAgreement, amount: string) {
    const numAmount = parseFloat(amount);
    const found = this.selectedDebts.find(d => d.agreement.agreement_id === debt.agreement_id);
    if (found) {
      found.amountToPay = isNaN(numAmount) ? 0 : numAmount;
      this.cdr.detectChanges();
    }
  }

  getDebtPaymentAmountFormatted(debt: PaymentAgreement): string {
    if (debt.agreement_id !== undefined && this.rawInputValues[debt.agreement_id] !== undefined) {
      return this.rawInputValues[debt.agreement_id];
    }
    const amount = this.getDebtPaymentAmount(debt);
    return amount.toFixed(2);
  }

  onDebtInput(event: Event, debt: PaymentAgreement) {
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
    
    const maxVal = Number(debt.remaining_amount);
    if (amount > maxVal) {
      amount = maxVal;
      cleanValue = maxVal.toString();
    }
    
    if (debt.agreement_id !== undefined) {
      this.rawInputValues[debt.agreement_id] = cleanValue;
    }
    
    const found = this.selectedDebts.find(d => d.agreement.agreement_id === debt.agreement_id);
    if (found) {
      found.amountToPay = amount;
    } else {
      this.selectedDebts.push({ agreement: debt, amountToPay: amount });
    }
    
    inputElement.value = cleanValue;
  }

  onDebtBlur(event: Event, debt: PaymentAgreement) {
    if (debt.agreement_id !== undefined) {
      delete this.rawInputValues[debt.agreement_id];
    }
    const amount = this.getDebtPaymentAmount(debt);
    const inputElement = event.target as HTMLInputElement;
    inputElement.value = amount.toFixed(2);
    this.cdr.detectChanges();
  }

  private loadInvoiceDetailsIfNeeded(invoice: Invoice) {
    if (!invoice.details) {
      this.invoicesService.getInvoiceDetails(invoice.invoice_id).subscribe(details => {
        invoice.details = details;
        this.cdr.detectChanges();
      });
    }
  }

  get totalSelectedInvoicesAmount(): number {
    return this.selectedInvoices.reduce((acc, inv) => acc + inv.total_amount, 0);
  }

  get totalSelectedDebtsAmount(): number {
    return this.selectedDebts.reduce((acc, debt) => acc + debt.amountToPay, 0);
  }

  get totalSelectedAmount(): number {
    return this.totalSelectedInvoicesAmount + this.totalSelectedDebtsAmount;
  }

  get totalConsumptionAmount(): number {
    return this.selectedInvoices.reduce((acc, inv) => {
      const consumption = inv.details?.readings?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0;
      return acc + consumption;
    }, 0);
  }

  get totalConceptsAmount(): number {
    return this.selectedInvoices.reduce((acc, inv) => {
      const concepts = inv.details?.concepts?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
      return acc + concepts;
    }, 0);
  }

  get selectedInvoiceForDetail(): Invoice | null {
    return this.selectedInvoices.length > 0 ? this.selectedInvoices[this.selectedInvoices.length - 1] : null;
  }

  get allSelectedPaid(): boolean {
    if (this.selectedInvoices.length === 0) return false;
    return this.selectedInvoices.every(inv => inv.status === 'paid');
  }

  get allSelectedPending(): boolean {
    if (this.selectedInvoices.length === 0 && this.selectedDebts.length === 0) return false;
    
    // Si hay facturas, todas deben ser pendientes.
    if (this.selectedInvoices.length > 0) {
      return this.selectedInvoices.every(inv => inv.status === 'pending');
    }
    
    // Si no hay facturas pero hay deudas seleccionadas
    return this.selectedDebts.length > 0;
  }

  onOpenInvoiceDetail() {
    this.showInvoiceDetailModal = true;
    this.cdr.detectChanges();
  }

  getPendingCount(user: any): number {
    return user.pending_count || 0;
  }

  getTotalDebt(user: any): number {
    const invoicesDebt = parseFloat(user.total_debt) || 0;
    const debtsAmount = this.userDebts.reduce((acc, d) => acc + Number(d.remaining_amount), 0);
    return invoicesDebt + debtsAmount;
  }

  onCollectPayment() {
    if (this.selectedInvoices.length === 0 && this.selectedDebts.length === 0) return;
    this.invoicesToCollect = this.selectedInvoices.map(i => i.invoice_id);
    this.totalToPay = this.totalSelectedAmount;
    this.openPaymentDialog();
  }

  onCollectAllPayments() {
    if (!this.selectedUser) return;
    const pendingInvoices = this.selectedUser.invoices.filter((i: any) => i.status === 'pending');
    
    this.invoicesToCollect = pendingInvoices.map((i: any) => i.invoice_id);
    
    // Select all debts
    this.selectedDebts = this.userDebts.map(d => ({ agreement: d, amountToPay: Number(d.remaining_amount) }));
    
    this.totalToPay = this.getTotalDebt(this.selectedUser);
    this.openPaymentDialog();
  }

  openPaymentDialog() {
    if (this.paymentProcessing) return;
    this.amountReceived = null;
    this.changeAmount = 0;
    this.paymentMethod = 'cash';
    this.accountId = null;
    this.referenceNumber = '';
    this.showPaymentDialog = true;
    this.cdr.detectChanges();
  }

  calculateChange() {
    if (this.amountReceived !== null) {
      this.changeAmount = Math.max(0, this.amountReceived - this.totalToPay);
    } else {
      this.changeAmount = 0;
    }
    this.cdr.detectChanges();
  }

  onCashEnter(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if ((event as KeyboardEvent).repeat || (event as KeyboardEvent).isComposing) return;
    if (this.paymentMethod === 'cash') this.onConfirmPayment();
  }

  onConfirmPayment() {
    if (this.paymentProcessing || !this.showPaymentDialog) return;
    if (!Number.isFinite(this.totalToPay) || this.totalToPay <= 0) return;
    if (this.paymentMethod === 'cash') {
      if (this.amountReceived === null || !Number.isFinite(this.amountReceived) || this.amountReceived < this.totalToPay) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Atención',
          detail: 'El monto recibido en efectivo debe ser mayor o igual al total a pagar.'
        });
        return;
      }
    } else {
      this.amountReceived = this.totalToPay;
      this.changeAmount = 0;
    }
    
    if (this.paymentMethod !== 'cash' && !this.accountId) {
      this.messageService.add({severity:'warn', summary:'Atención', detail:'Debe seleccionar una cuenta bancaria'});
      return;
    }

    const idempotencyKey = crypto.randomUUID();
    this.paymentProcessing = true;
    this.invoicesService.collectCombinedPayment({
      invoice_ids: this.invoicesToCollect,
      debt_payments: this.selectedDebts.map(debt => ({
        agreement_id: debt.agreement.agreement_id!,
        amount: debt.amountToPay
      })),
      amount_tendered: this.amountReceived || this.totalToPay,
      payment_method: this.paymentMethod,
      account_id: this.accountId,
      reference_number: this.referenceNumber || null,
      idempotency_key: idempotencyKey
    }).subscribe({
      next: (result: any) => {
        this.paymentProcessing = false;
        this.cdr.markForCheck();
        // Print Receipts
        if (this.invoicesToCollect.length > 0) {
          this.invoicesService.printReceipt(this.invoicesToCollect).subscribe();
        }

        let printDelay = this.invoicesToCollect.length > 0 ? 1000 : 0;
        (result.debt_payment_ids || []).forEach((paymentId: number) => {
          if (paymentId) {
            setTimeout(() => {
              this.agreementsService.printReceipt(paymentId).subscribe();
            }, printDelay);
            printDelay += 1000;
          }
        });

        this.showPaymentDialog = false;
        this.amountReceived = 0;
        this.changeAmount = 0;
        this.selectedInvoices = [];
        this.selectedDebts = [];

        this.messageService.add({
          severity: 'success',
          summary: 'Cobro Exitoso',
          detail: 'Se ha registrado el pago correctamente.'
        });

        this.refreshData();
      },
      error: (err) => {
        this.paymentProcessing = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Hubo un error al procesar el cobro combinado.'
        });
      }
    });
  }

  refreshData() {
    this.loadPendingUsers();
    if (this.selectedUser) {
      // Re-trigger selection logic to refresh all parts
      this.onSelectUser({ value: this.selectedUser });
    }
  }

  onViewAllInvoices() {
    this.showInvoicesTable = true;
    this.cdr.detectChanges();
  }

  onVoidPayment(invoice: Invoice) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas ANULAR el pago de la factura de ${this.formatMonth(invoice.billing_month)}? La factura volverá a estar pendiente de cobro.`,
      header: 'Confirmar Anulación',
      inputLabel: 'Motivo de la anulación',
      inputMinLength: 5,
      acceptLabel: 'Sí, Anular',
      rejectLabel: 'Cerrar',
      accept: (reason) => {
        if (!reason || reason.trim().length < 5) return;
        this.invoicesService.voidPayment(invoice.invoice_id, reason.trim()).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Anulado',
              detail: 'El pago ha sido anulado y la factura está pendiente.'
            });
            this.refreshData();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo anular el pago.'
            });
          }
        });
      }
    });
  }

  downloadPDF(invoice: Invoice) {
    this.invoicesService.printReceipt([invoice.invoice_id]).subscribe();
  }

  formatMonth(billingMonth: string): string {
    const months: { [key: string]: string } = {
      '01': 'ENERO', '02': 'FEBRERO', '03': 'MARZO', '04': 'ABRIL',
      '05': 'MAYO', '06': 'JUNIO', '07': 'JULIO', '08': 'AGOSTO',
      '09': 'SEPTIEMBRE', '10': 'OCTUBRE', '11': 'NOVIEMBRE', '12': 'DICIEMBRE'
    };
    const [year, month] = billingMonth.split('-');
    return `${year}-${months[month] || month}`;
  }
}
