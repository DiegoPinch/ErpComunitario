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
import { InvoicesService, UserPendingSummary, Invoice } from '../../../core/services/invoices.service';
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
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  users: any[] = [];
  selectedUser: any | null = null;
  selectedInvoices: Invoice[] = [];
  showInvoicesTable: boolean = false;
  showInvoiceDetailModal: boolean = false;

  // Track search/filter state if needed, normally listbox handles it

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

  // Configuración para CustomTable (Historial)
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

  formattedInvoices: any[] = [];

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
      return;
    }

    this.invoicesService.getUserInvoices(user.user_id).subscribe(invoices => {
      this.selectedUser = { ...user, invoices };
      this.prepareFormattedInvoices(invoices);
      this.selectedInvoices = [];

      const firstPending = invoices.find(i => i.status === 'pending');
      if (firstPending) {
        this.selectedInvoices = [firstPending];
        this.loadInvoiceDetailsIfNeeded(firstPending);
      }
      this.cdr.detectChanges();
    });
  }

  prepareFormattedInvoices(invoices: Invoice[]) {
    this.formattedInvoices = invoices.map(inv => ({
      invoice_id_display: `#${inv.invoice_id}`,
      billing_month_display: this.formatMonth(inv.billing_month),
      issue_date_display: new Date(inv.issue_date).toLocaleDateString('es-ES'),
      total_amount_display: `$${inv.total_amount.toFixed(2)}`,
      status_display: inv.status === 'paid' ? 'PAGADA' : 'PENDIENTE',
      original: inv // Guardamos la referencia original para las acciones
    }));
  }

  isSelected(invoice: Invoice): boolean {
    return this.selectedInvoices.some(i => i.invoice_id === invoice.invoice_id);
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

  private loadInvoiceDetailsIfNeeded(invoice: Invoice) {
    if (!invoice.details) {
      this.invoicesService.getInvoiceDetails(invoice.invoice_id).subscribe(details => {
        invoice.details = details;
        this.cdr.detectChanges();
      });
    }
  }

  get totalSelectedAmount(): number {
    return this.selectedInvoices.reduce((acc, inv) => acc + inv.total_amount, 0);
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
    return this.selectedInvoices.length > 0 && this.selectedInvoices.every(inv => inv.status === 'paid');
  }

  get allSelectedPending(): boolean {
    return this.selectedInvoices.length > 0 && this.selectedInvoices.every(inv => inv.status === 'pending');
  }

  onOpenInvoiceDetail() {
    this.showInvoiceDetailModal = true;
    this.cdr.detectChanges();
  }

  getPendingCount(user: any): number {
    return user.pending_count || 0;
  }

  getTotalDebt(user: any): number {
    return parseFloat(user.total_debt) || 0;
  }

  onCollectPayment() {
    if (this.selectedInvoices.length === 0) return;
    this.invoicesToCollect = this.selectedInvoices.map(i => i.invoice_id);
    this.totalToPay = this.totalSelectedAmount;
    this.openPaymentDialog();
  }

  onCollectAllPayments() {
    if (!this.selectedUser) return;
    const pendingInvoices = this.selectedUser.invoices.filter((i: any) => i.status === 'pending');
    if (pendingInvoices.length === 0) return;

    this.invoicesToCollect = pendingInvoices.map((i: any) => i.invoice_id);
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

    this.invoicesService.collectPayments(this.invoicesToCollect, this.amountReceived, this.changeAmount).subscribe({
      next: () => {
        // Generar y descargar Factura PDF
        const receiptUrl = this.invoicesService.getReceiptUrl(this.invoicesToCollect);
        window.open(receiptUrl, '_blank');

        this.showPaymentDialog = false;
        this.amountReceived = 0;
        this.changeAmount = 0;
        this.selectedInvoices = [];

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
          detail: 'Hubo un error al procesar el cobro.'
        });
      }
    });
  }

  refreshData() {
    this.loadPendingUsers();
    if (this.selectedUser) {
      this.invoicesService.getUserInvoices(this.selectedUser.user_id).subscribe(invoices => {
        this.selectedUser.invoices = invoices;
        this.prepareFormattedInvoices(invoices);
        this.cdr.detectChanges();
      });
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
    const receiptUrl = this.invoicesService.getReceiptUrl([invoice.invoice_id]);
    window.open(receiptUrl, '_blank');
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
