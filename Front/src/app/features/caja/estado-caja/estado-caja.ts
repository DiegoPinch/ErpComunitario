import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, forkJoin, map } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { FinancialService } from '../../../core/services/financial.service';
import { FinancialBalance, ConceptCollection, Expense } from '../../../core/models/financial.model';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-estado-caja',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    TagModule,
    CustomTable
  ],
  templateUrl: './estado-caja.html',
  styleUrl: './estado-caja.css',
})
export class EstadoCaja implements OnInit {
  private financialService = inject(FinancialService);
  private cdr = inject(ChangeDetectorRef);

  // Datos financieros
  balance: number = 0;
  totalIncome: number = 0;
  totalExpenses: number = 0;

  collectionsByConcept: ConceptCollection[] = [];
  recentExpenses$!: Observable<any[]>;
  todaysDate: Date = new Date();

  // Configuración de tabla
  expenseCols: any[] = [];

  ngOnInit() {
    this.setupColumns();
    this.loadDashboardData();
  }

  setupColumns() {
    this.expenseCols = [
      { field: 'date_display', header: 'FECHA' },
      { field: 'category_name', header: 'CATEGORÍA' },
      { field: 'description', header: 'CONCEPTO' },
      { field: 'payment_method', header: 'MÉTODO' },
      { field: 'amount_display', header: 'VALOR', style: { 'text-align': 'right', 'font-weight': 'bold' } }
    ];
  }

  loadDashboardData() {
    // 1. Cargar Balance y Resumen
    forkJoin({
      balance: this.financialService.getBalance(),
      collections: this.financialService.getCollectionByConcept(),
      expenses: this.financialService.getExpenses()
    }).subscribe(({ balance, collections, expenses }) => {
      this.balance = balance.balance;
      this.collectionsByConcept = collections;

      // Calcular Totales
      this.totalIncome = collections.reduce((acc, curr) => acc + parseFloat(curr.total_collected.toString()), 0);
      this.totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount.toString()), 0);

      this.cdr.detectChanges();
    });

    // 2. Cargar Gatos para la tabla (últimos 10)
    this.recentExpenses$ = this.financialService.getExpenses().pipe(
      map(expenses => expenses.slice(0, 10).map(e => ({
        ...e,
        amount_display: `$${parseFloat(e.amount.toString()).toFixed(2)}`,
        date_display: new Date(e.expense_date).toLocaleDateString(),
        description: e.description.toUpperCase(),
        category_name: e.category_name?.toUpperCase()
      })))
    );
  }

  getPercentage(amount: number): number {
    if (this.totalIncome === 0) return 0;
    return Math.round((amount / this.totalIncome) * 100);
  }
}
