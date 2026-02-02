import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, map } from 'rxjs';
import { RatesService } from '../../../core/services/rates.service';
import { Rate } from '../../../core/models/rate.model';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CustomTable,
    TableModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './tarifas.html',
  styleUrl: './tarifas.css',
})
export class Tarifas implements OnInit {
  private ratesService = inject(RatesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  rates$!: Observable<any[]>;
  cols: any[] = [];
  actions: TableAction[] = [];

  rateDialog: boolean = false;
  rateForm: FormGroup = this.fb.group({
    meter_type: ['', Validators.required],
    unit_price: [null, [Validators.required, Validators.min(0)]],
    base_limit: [null, [Validators.required, Validators.min(0)]],
    excess_price: [null, [Validators.required, Validators.min(0)]],
    active: [true],
    start_date: [null],
    end_date: [null]
  });

  meterTypes = [
    { label: 'consumo', value: 'CONSUMO' },
    { label: 'riego', value: 'RIEGO' },
  ];

  ngOnInit(): void {
    this.setupColumns();
    this.setupActions();
    this.loadRates();
  }

  loadRates() {
    this.rates$ = this.ratesService.getRates().pipe(
      map(rates => rates.map(r => ({
        ...r,
        unit_price_display: `$${parseFloat(r.unit_price.toString())}`,
        excess_price_display: `$${parseFloat(r.excess_price.toString())}`,
        status_label: r.active ? 'ACTIVA' : 'INACTIVA'
      })))
    );
  }

  setupColumns() {
    this.cols = [
      { field: 'meter_type', header: 'Tipo de Medidor' },
      { field: 'base_limit', header: 'Límite Base (m³)' },
      { field: 'unit_price_display', header: 'Precio Base' },
      { field: 'excess_price_display', header: 'Precio Exceso' },
      {
        field: 'status_label',
        header: 'Estado',
        type: 'tag',
        tagSeverity: (val: string) => val === 'ACTIVA' ? 'success' : 'danger'
      }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Desactivar',
        icon: 'pi pi-ban',
        styleClass: 'p-button-text p-button-danger',
        tooltip: 'Desactivar Tarifa',
        command: (row: Rate) => this.deactivateRate(row)
      }
    ];
  }

  openNew() {
    this.rateForm.reset({
      active: true,
      base_limit: null,
      unit_price: null,
      excess_price: null
    });
    this.rateDialog = true;
  }



  saveRate() {
    if (this.rateForm.invalid) {
      this.rateForm.markAllAsTouched();
      return;
    }

    const rateData = this.rateForm.getRawValue();

    this.ratesService.createRate(rateData).subscribe({
      next: () => {
        this.showSuccess('Tarifa creada correctamente');
        this.loadRates();
        this.rateDialog = false;
      },
      error: (err) => this.showError(err.error?.message || 'Error al crear')
    });
  }

  deactivateRate(rate: Rate) {
    this.confirmationService.confirm({
      message: `¿Está seguro de desactivar la tarifa para "${rate.meter_type}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (rate.rate_id) {
          this.ratesService.deleteRate(rate.rate_id).subscribe({
            next: () => {
              this.showSuccess('Tarifa desactivada');
              this.loadRates();
            },
            error: (err) => this.showError(err.error?.message || 'Error al desactivar')
          });
        }
      }
    });
  }

  private showSuccess(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
  }

  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Atención', detail: msg, life: 5000 });
  }
}
