import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listbox } from 'primeng/listbox';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ReportsService } from '../../../core/services/reports.service';
import { AccountingPeriodsService, AccountingPeriod } from '../../../core/services/accounting-periods';
import { PdfPreview } from '../../../shared/components/pdf-preview/pdf-preview';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  filters: string[];
  category: string;
}

@Component({
  selector: 'app-reporte-general',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Listbox,
    Button,
    Card,
    ToastModule,
    SelectModule,
    PdfPreview
  ],
  providers: [MessageService],
  templateUrl: './reporte-general.html',
  styleUrl: './reporte-general.css',
})
export class ReporteGeneral implements OnInit {
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);

  constructor() { }
  previewVisible = false;
  previewUrl = '';
  previewTitle = '';
  dateRange: Date[] = [];
  selectedReport: ReportType | null = null;
  selectedMonthStart: string = '';
  selectedMonthEnd: string = '';
  selectedDate: string = '';
  selectedDateStart: string = '';
  selectedDateEnd: string = '';
  minMonth: string = '';
  maxMonth: string = '';
  reportCategoryTitle: string = 'Reportes Generales';

  allReportTypes: ReportType[] = [
    {
      id: 'users-meters',
      title: 'Directorio de Usuarios y Medidores',
      description: 'Listado completo de usuarios registrados con sus medidores asignados, tipos de servicio y estado de vinculación.',
      icon: 'pi-users',
      gradientFrom: '#6366f1',
      gradientTo: '#4f46e5',
      filters: [],
      category: 'general'
    },
    {
      id: 'readings',
      title: 'Historial de Lecturas por Usuario',
      description: 'Registro detallado de lecturas de agua por usuario y medidor, incluyendo consumo mensual y tendencias.',
      icon: 'pi-chart-line',
      gradientFrom: '#3b82f6',
      gradientTo: '#1d4ed8',
      filters: ['monthRange'],
      category: 'general'
    },
    {
      id: 'active-users',
      title: 'Directorio de Usuarios Activos',
      description: 'Listado simplificado de todos los usuarios en estado activo, ordenados alfabéticamente por apellido.',
      icon: 'pi-user-check',
      gradientFrom: '#f43f5e',
      gradientTo: '#e11d48',
      filters: [],
      category: 'general'
    },
    {
      id: 'recollection',
      title: 'Recaudación por Periodo de Emisión',
      description: 'Muestra los cobros recibidos agrupados según el mes en que se emitió la factura de agua. Útil para analizar la efectividad del cobro de un mes, no para cuadrar el dinero físico diario del tesorero.',
      icon: 'pi-dollar',
      gradientFrom: '#10b981',
      gradientTo: '#059669',
      filters: ['monthRange'],
      category: 'financiero'
    },
    {
      id: 'delinquency',
      title: 'Reporte de Morosidad (Cartera Vencida)',
      description: 'Facturas pendientes de pago por periodo y usuarios morosos.',
      icon: 'pi-exclamation-triangle',
      gradientFrom: '#f59e0b',
      gradientTo: '#d97706',
      filters: ['monthRange'],
      category: 'financiero'
    },
    {
      id: 'additional-charges',
      title: 'Reporte de Rubros Adicionales',
      description: 'Detalle de rubros adicionales pagados por mes, listado de usuarios y totales recaudados por concepto.',
      icon: 'pi-receipt',
      gradientFrom: '#8b5cf6',
      gradientTo: '#7c3aed',
      filters: ['monthRange'],
      category: 'financiero'
    },
    {
      id: 'daily-collections',
      title: 'Cuadre de Caja y Arqueo de Recaudación',
      description: 'Detalla el dinero total esperado en efectivo físico (Caja Chica) y depósitos (Bancos) según la Fecha de Pago. Desglosa los cobros en Agua, Multas, Convenios e Ingresos Extraordinarios.',
      icon: 'pi-wallet',
      gradientFrom: '#0ea5e9',
      gradientTo: '#0284c7',
      filters: ['singleDate'],
      category: 'financiero'
    },
    {
      id: 'incomes',
      title: 'Reporte Detallado de Ingresos',
      description: 'Detalla cronológicamente todas las recaudaciones y cobros (consumo de agua, multas, rubros, venta de ramal, donaciones y colaboraciones) en un rango de meses.',
      icon: 'pi-plus-circle',
      gradientFrom: '#10b981',
      gradientTo: '#059669',
      filters: ['monthRange'],
      category: 'financiero'
    },
    {
      id: 'expenses',
      title: 'Reporte Detallado de Egresos',
      description: 'Detalla todos los egresos y gastos realizados por la Junta en un rango de meses, incluyendo fecha, categoría, descripción y forma de pago.',
      icon: 'pi-minus-circle',
      gradientFrom: '#ef4444',
      gradientTo: '#991b1b',
      filters: ['monthRange'],
      category: 'financiero'
    },
    {
      id: 'bank-accounts',
      title: 'Auxiliar de Cuentas Bancarias',
      description: 'Muestra los movimientos de cada cuenta bancaria activa (depósitos, transferencias, egresos), incluyendo origen, concepto, número de transferencia y saldos.',
      icon: 'pi-credit-card',
      gradientFrom: '#10b981',
      gradientTo: '#0284c7',
      filters: ['monthRange'],
      category: 'financiero'
    },
    {
      id: 'comprehensive',
      title: 'Reporte Integral Contable',
      description: 'Reporte financiero definitivo que muestra ingresos por concepto, egresos por categoría, saldos en bancos y cuentas por cobrar.',
      icon: 'pi-book',
      gradientFrom: '#8b5cf6',
      gradientTo: '#4c1d95',
      filters: ['accountingPeriod'],
      category: 'financiero'
    }
  ];

  reportTypes: ReportType[] = [];

  private accountingPeriodsService = inject(AccountingPeriodsService);
  accountingPeriods: any[] = [];
  selectedPeriodId: any = null;

  ngOnInit() {
    // Determine category from route data
    const category = this.route.snapshot.data['type'] || 'general';
    this.reportCategoryTitle = category === 'financiero' ? 'Reportes Financieros' : 'Reportes Generales';
    this.reportTypes = this.allReportTypes.filter(r => r.category === category);
    // Inicializar con el mes y fecha actual
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    this.selectedMonthStart = `${year}-${month}`;
    this.selectedMonthEnd = `${year}-${month}`;
    this.selectedDate = `${year}-${month}-${day}`;

    // Permitir desde 5 años atrás hasta 2 años adelante
    this.minMonth = `${year - 5}-01`;
    this.maxMonth = `${year + 2}-12`;

    // Cargar periodos contables
    this.accountingPeriodsService.getAll().subscribe({
      next: (periods) => {
        this.accountingPeriods = [
          { period_id: null, title: 'Periodo Actual (En Curso)' },
          ...periods
        ];
        this.selectedPeriodId = null;
      },
      error: (err) => console.error('Error al cargar periodos', err)
    });
  }

  selectReport(report: ReportType) {
    this.selectedReport = report;
  }

  onMonthStartChange() {
    // Si el mes final es anterior al mes inicial, ajustarlo
    if (this.selectedMonthEnd && this.selectedMonthStart > this.selectedMonthEnd) {
      this.selectedMonthEnd = this.selectedMonthStart;
    }
  }

  onMonthEndChange() {
    // Si el mes final es anterior al mes inicial, ajustar el mes inicial
    if (this.selectedMonthStart && this.selectedMonthEnd < this.selectedMonthStart) {
      this.selectedMonthStart = this.selectedMonthEnd;
    }
  }

  exportReport(format: 'pdf' | 'excel') {
    if (!this.selectedReport) return;

    if (this.needsMonthFilter() && (!this.selectedMonthStart || !this.selectedMonthEnd)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor seleccione un rango de meses.'
      });
      return;
    }

    if (this.needsDateFilter() && !this.selectedDate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor seleccione una fecha.'
      });
      return;
    }

    if (this.needsDateRangeFilter() && (!this.selectedDateStart || !this.selectedDateEnd)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor seleccione un rango de fechas.'
      });
      return;
    }

    let reportObservable: Observable<any[]>;

    switch (this.selectedReport.id) {
      case 'users-meters':
        reportObservable = this.reportsService.getUsersMetersReport();
        break;
      case 'readings':
        reportObservable = this.reportsService.getReadingsReport(this.selectedMonthStart, this.selectedMonthEnd);
        break;
      case 'recollection':
        reportObservable = this.reportsService.getRecollectionReport(this.selectedMonthStart, this.selectedMonthEnd);
        break;
      case 'delinquency':
        reportObservable = this.reportsService.getDelinquencyReport(this.selectedMonthStart, this.selectedMonthEnd);
        break;
      case 'additional-charges':
        reportObservable = this.reportsService.getAdditionalChargesReport(this.selectedMonthStart, this.selectedMonthEnd);
        break;
      case 'active-users':
        reportObservable = this.reportsService.getActiveUsersReport();
        break;
      case 'daily-collections':
        reportObservable = this.reportsService.getDailyCollectionsReport(this.selectedDate);
        break;
      case 'incomes':
        reportObservable = this.reportsService.getIncomesReport(this.selectedMonthStart, this.selectedMonthEnd);
        break;
      case 'expenses':
        reportObservable = this.reportsService.getExpensesReport(this.selectedMonthStart, this.selectedMonthEnd);
        break;
      case 'bank-accounts':
        reportObservable = this.reportsService.getBankAccountsLedgerReport(this.selectedMonthStart, this.selectedMonthEnd);
        break;

      case 'comprehensive':
        const pdfUrl = this.reportsService.getReportPdfUrl(
          this.selectedReport.id,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          this.selectedPeriodId
        );
        window.open(pdfUrl, '_blank');
        return;
      default:
        console.error('Reporte no reconocido');
        return;
    }

    reportObservable.subscribe({
      next: (data: any) => {
        // Soporte para reporte compuesto
        const reportData = (data && data.resumen) ? data.resumen : data;

        if (!reportData || reportData.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Información',
            detail: 'No se encontraron datos para este reporte y periodo.'
          });
          return;
        }

        if (format === 'excel') {
          this.downloadCSV(reportData, this.selectedReport!.title);
        } else {
          // Para PDF, abrimos la URL del backend directamente
          const pdfUrl = this.reportsService.getReportPdfUrl(
            this.selectedReport!.id,
            this.needsMonthFilter() ? this.selectedMonthStart : undefined,
            this.needsMonthFilter() ? this.selectedMonthEnd : undefined,
            this.needsDateFilter() ? this.selectedDate : undefined
          );
          window.open(pdfUrl, '_blank');
        }
      },
      error: (err: any) => {
        console.error('Error al obtener reporte:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al generar el reporte.'
        });
      }
    });
  }

  previewPdf() {
    if (!this.selectedReport) return;

    if (this.needsMonthFilter() && (!this.selectedMonthStart || !this.selectedMonthEnd)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor seleccione un rango de meses.'
      });
      return;
    }

    if (this.needsDateFilter() && !this.selectedDate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor seleccione una fecha.'
      });
      return;
    }

    if (this.needsDateRangeFilter() && (!this.selectedDateStart || !this.selectedDateEnd)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor seleccione un rango de fechas.'
      });
      return;
    }

    let pdfUrl = '';

    if (this.selectedReport!.id === 'comprehensive') {
      pdfUrl = this.reportsService.getReportPdfUrl(
        this.selectedReport!.id,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        this.selectedPeriodId
      );
    } else {
      pdfUrl = this.reportsService.getReportPdfUrl(
        this.selectedReport!.id,
        this.needsMonthFilter() ? this.selectedMonthStart : undefined,
        this.needsMonthFilter() ? this.selectedMonthEnd : undefined,
        this.needsDateFilter() ? this.selectedDate : undefined
      );
    }

    this.previewUrl = pdfUrl;
    this.previewTitle = `Vista Previa: ${this.selectedReport!.title}`;
    this.previewVisible = true;
  }

  private downloadCSV(data: any[], title: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  needsDateFilter(): boolean {
    return this.selectedReport?.filters.includes('singleDate') || false;
  }

  needsMonthFilter(): boolean {
    return this.selectedReport?.filters.includes('monthRange') || false;
  }

  needsDateRangeFilter(): boolean {
    return this.selectedReport?.filters.includes('dateRange') || false;
  }

  needsAccountingPeriodFilter(): boolean {
    return this.selectedReport?.filters.includes('accountingPeriod') || false;
  }
}
