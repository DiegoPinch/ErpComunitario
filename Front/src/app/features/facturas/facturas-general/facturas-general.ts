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
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { InvoicesService } from '../../../core/services/invoices.service';
import { PaymentAgreementsService, PaymentAgreement } from '../../../core/services/payment-agreements';
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
    ConfirmDialogModule,
    CustomTable
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './facturas-general.html',
  styleUrl: './facturas-general.css'
})
export class FacturasGeneral implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private invoicesService = inject(InvoicesService);
  private agreementsService = inject(PaymentAgreementsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

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

  // Propiedades para el diálogo de cobro
  showPaymentDialog: boolean = false;
  amountReceived: number | null = null;
  changeAmount: number = 0;
  totalToPay: number = 0;
  invoicesToCollect: number[] = [];

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
    this.amountReceived = null;
    this.changeAmount = 0;
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

  onConfirmPayment() {
    if (this.amountReceived === null || this.amountReceived < this.totalToPay) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'El monto recibido debe ser mayor o igual al total a pagar.'
      });
      return;
    }

    const requests = [];

    // 1. Process Water Invoices
    if (this.invoicesToCollect.length > 0) {
      // Si hay abonos a deudas, el vuelto se lo asignamos a la factura de agua (por simplicidad contable en la BD).
      requests.push(this.invoicesService.collectPayments(this.invoicesToCollect, this.totalSelectedInvoicesAmount + this.changeAmount, this.changeAmount));
    }

    // 2. Process Debt Payments
    if (this.selectedDebts.length > 0) {
      for (const debt of this.selectedDebts) {
        requests.push(this.agreementsService.addDebtPayment(debt.agreement.agreement_id!, debt.amountToPay));
      }
    }

    if (requests.length === 0) return;

    forkJoin(requests).subscribe({
      next: (results) => {
        // Print Receipts
        if (this.invoicesToCollect.length > 0) {
          this.invoicesService.printReceipt(this.invoicesToCollect).subscribe();
        }

        const debtResults = this.invoicesToCollect.length > 0 ? results.slice(1) : results;
        let printDelay = this.invoicesToCollect.length > 0 ? 1000 : 0;
        
        debtResults.forEach((res: any) => {
          if (res && res.debt_payment_id) {
            setTimeout(() => {
              this.agreementsService.printReceipt(res.debt_payment_id).subscribe();
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
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Anular',
      rejectLabel: 'Cerrar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.invoicesService.voidPayment(invoice.invoice_id).subscribe({
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
