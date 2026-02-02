import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listbox } from 'primeng/listbox';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ReportsService } from '../../../core/services/reports.service';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  filters: string[];
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
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './reporte-general.html',
  styleUrl: './reporte-general.css',
})
export class ReporteGeneral implements OnInit {
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);

  constructor() { }
  dateRange: Date[] = [];
  selectedReport: ReportType | null = null;
  selectedMonthStart: string = '';
  selectedMonthEnd: string = '';
  minMonth: string = '';
  maxMonth: string = '';

  reportTypes: ReportType[] = [
    {
      id: 'users-meters',
      title: 'Directorio de Usuarios y Medidores',
      description: 'Listado completo de usuarios registrados con sus medidores asignados, tipos de servicio y estado de vinculación.',
      icon: 'pi-users',
      gradientFrom: '#6366f1',
      gradientTo: '#4f46e5',
      filters: []
    },
    {
      id: 'readings',
      title: 'Historial de Lecturas por Usuario',
      description: 'Registro detallado de lecturas de agua por usuario y medidor, incluyendo consumo mensual y tendencias.',
      icon: 'pi-chart-line',
      gradientFrom: '#3b82f6',
      gradientTo: '#1d4ed8',
      filters: ['monthRange']
    },
    {
      id: 'recollection',
      title: 'Reporte de Recaudación',
      description: 'Facturas pagadas por periodo con detalle de usuarios, incluye rubros adicionales en caso de existir.',
      icon: 'pi-dollar',
      gradientFrom: '#10b981',
      gradientTo: '#059669',
      filters: ['monthRange']
    },
    {
      id: 'delinquency',
      title: 'Reporte de Morosidad',
      description: 'Facturas pendientes de pago por periodo, usuarios morosos, incluye rubros adicionales en caso de existir.',
      icon: 'pi-exclamation-triangle',
      gradientFrom: '#f59e0b',
      gradientTo: '#d97706',
      filters: ['monthRange']
    },
    {
      id: 'additional-charges',
      title: 'Reporte de Rubros Adicionales',
      description: 'Detalle de rubros adicionales pagados por mes, listado de usuarios y totales recaudados por concepto.',
      icon: 'pi-receipt',
      gradientFrom: '#8b5cf6',
      gradientTo: '#7c3aed',
      filters: ['monthRange']
    },
    {
      id: 'active-users',
      title: 'Directorio de Usuarios Activos',
      description: 'Listado simplificado de todos los usuarios en estado activo, ordenados alfabéticamente por apellido.',
      icon: 'pi-user-check',
      gradientFrom: '#f43f5e',
      gradientTo: '#e11d48',
      filters: []
    }
  ];

  ngOnInit() {
    // Inicializar con el mes actual
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedMonthStart = `${year}-${month}`;
    this.selectedMonthEnd = `${year}-${month}`;

    // Permitir desde 5 años atrás hasta 2 años adelante
    this.minMonth = `${year - 5}-01`;
    this.maxMonth = `${year + 2}-12`;
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

    let reportObservable;

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
      default:
        console.error('Reporte no reconocido');
        return;
    }

    reportObservable.subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Información',
            detail: 'No se encontraron datos para este reporte y periodo.'
          });
          return;
        }

        if (format === 'excel') {
          this.downloadCSV(data, this.selectedReport!.title);
        } else {
          // Para PDF, abrimos la URL del backend directamente
          const pdfUrl = this.reportsService.getReportPdfUrl(
            this.selectedReport!.id,
            this.selectedMonthStart,
            this.selectedMonthEnd
          );
          window.open(pdfUrl, '_blank');
        }
      },
      error: (err) => {
        console.error('Error al obtener reporte:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al generar el reporte.'
        });
      }
    });
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
    return this.selectedReport?.filters.includes('dateRange') || false;
  }

  needsMonthFilter(): boolean {
    return this.selectedReport?.filters.includes('monthRange') || false;
  }
}
