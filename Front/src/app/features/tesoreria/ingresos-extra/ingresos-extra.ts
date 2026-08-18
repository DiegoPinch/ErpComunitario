import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { OtherIncome, OtherIncomesService } from '../../../core/services/other-incomes.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';

@Component({
  selector: 'app-ingresos-extraordinarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomTable, ConfirmDialogModule, DialogModule, ButtonModule, InputNumberModule],
  providers: [ConfirmationService],
  templateUrl: './ingresos-extra.html'
})
export class IngresosExtraordinarios implements OnInit {
  incomes: any[] = [];
  columns: any[] = [];
  
  showForm = false;
  form: FormGroup;

  constructor(
    private incomesService: OtherIncomesService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      income_date: [new Date().toISOString().split('T')[0], Validators.required],
      description: ['', Validators.required],
      payment_method: ['cash', Validators.required],
      reference_number: ['']
    });
  }

  ngOnInit(): void {
    this.setupTable();
    this.loadIncomes();
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
