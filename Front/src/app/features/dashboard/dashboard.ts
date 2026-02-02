import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, CardModule, TagModule, TooltipModule, ButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  revenueData: any;
  revenueOptions: any;
  consumptionData: any;
  consumptionOptions: any;

  stats = {
    monthlyRevenue: 0,
    netBalance: 0,
    totalPendingDebt: 0,
    totalUsers: 0,
    totalMeters: 0,
    consumoMeters: 0,
    riegoMeters: 0,
    attendanceRate: 0
  };

  currentMonthName: string = '';

  topDebtors: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.currentMonthName = this.getCurrentMonthName();
    this.loadDashboardData();
  }

  getCurrentMonthName(): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentMonth = new Date().getMonth();
    return months[currentMonth];
  }

  loadDashboardData() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        console.log('Dashboard Data Received:', data);
        if (!data || !data.kpis) {
          console.error('Invalid backend response');
          return;
        }

        const meterDist = data.kpis.meterDistribution || [];

        // Reemplazamos el objeto completo para forzar la detección de cambios
        this.stats = {
          monthlyRevenue: data.kpis.monthlyRevenue || 0,
          netBalance: 0,
          totalPendingDebt: data.kpis.totalPendingDebt || 0,
          totalUsers: data.kpis.activeUsers || 0,
          totalMeters: meterDist.reduce((acc: number, m: any) => acc + (m.count || 0), 0),
          consumoMeters: meterDist.find((m: any) => (m.type || '').toUpperCase() === 'CONSUMO')?.count || 0,
          riegoMeters: meterDist.find((m: any) => (m.type || '').toUpperCase() === 'RIEGO')?.count || 0,
          attendanceRate: 85
        };

        this.topDebtors = data.criticalDebtors || [];

        this.initRevenueChart(data.revenueHistory || []);
        this.initConsumptionChart(data.consumptionTrend || []);

        // Forzamos el refresco visual
        this.cdr.detectChanges();
        console.log('Change detection forced. Stats:', this.stats);
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
      }
    });
  }

  formatMonth(monthStr: string): string {
    const months: { [key: string]: string } = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
    };
    const [year, month] = monthStr.split('-');
    return `${year}-${months[month] || month}`;
  }

  initRevenueChart(history: any[]) {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    this.revenueData = {
      labels: history.map(h => this.formatMonth(h.month)),
      datasets: [
        {
          label: 'Consumo Agua ($)',
          data: history.map(h => h.water_amount),
          backgroundColor: '#3b82f6',
          borderRadius: 6,
        },
        {
          label: 'Rubros Adicionales ($)',
          data: history.map(h => h.additional_amount),
          backgroundColor: '#a855f7',
          borderRadius: 6,
        }
      ]
    };

    this.revenueOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 6,
            padding: 15,
            font: { size: 10, weight: 700 }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: textColorSecondary, font: { weight: 500 } },
          grid: { display: false }
        },
        y: {
          stacked: true,
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder }
        }
      }
    };
  }

  initConsumptionChart(trend: any[]) {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');

    this.consumptionData = {
      labels: trend.map(t => this.formatMonth(t.month)),
      datasets: [
        {
          label: 'Consumo Doméstico (m³)',
          data: trend.map(t => t.domestic_consumption),
          borderColor: '#3b82f6',
          tension: 0.4,
          fill: false,
          borderWidth: 3,
          pointRadius: 2
        },
        {
          label: 'Consumo Riego (m³)',
          data: trend.map(t => t.irrigation_consumption),
          borderColor: '#8b5cf6',
          tension: 0.4,
          fill: false,
          borderWidth: 3,
          pointRadius: 2
        }
      ]
    };

    this.consumptionOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 6,
            padding: 15,
            font: { size: 10, weight: 700 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary },
          grid: { display: false }
        },
        y: {
          ticks: { color: textColorSecondary },
          grid: { display: false }
        }
      }
    };
  }
}
