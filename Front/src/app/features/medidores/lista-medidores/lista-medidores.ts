import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MeterService } from '../../../core/services/meter.service';
import { Meter } from '../../../core/models/meter.model';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-lista-medidores',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomTable,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './lista-medidores.html',
  styleUrl: './lista-medidores.css',
})
export class ListaMedidores implements OnInit {
  private meterService = inject(MeterService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  meters$!: Observable<any[]>;
  cols: any[] = [];
  actions: TableAction[] = [];

  // Estado del Modal
  displayDialog: boolean = false;
  dialogTitle: string = 'Nuevo Medidor';

  meterForm: FormGroup = this.fb.group({
    meter_id: [null],
    code: [{ value: '', disabled: true }, [Validators.required]],
    type: ['consumo', Validators.required],
    initial_reading: [1, [Validators.required, Validators.min(1)]],
    installation_date: [null, Validators.required],
    active: [true]
  });

  types = [
    { label: 'Consumo', value: 'consumo' },
    { label: 'Riego', value: 'riego' }
  ];

  ngOnInit() {
    this.setupColumns();
    this.setupActions();
    this.loadMeters();
    this.setupTypeListener();
  }

  setupTypeListener() {
    this.meterForm.get('type')?.valueChanges.subscribe(() => {
      this.generateMeterCode();
    });
  }

  generateMeterCode() {
    const type = this.meterForm.get('type')?.value || 'consumo';
    const typeInitial = type === 'riego' ? 'R' : 'C';
    const year = new Date().getFullYear().toString().substring(2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `M${typeInitial}-${year}-${random}`;
    this.meterForm.patchValue({ code });
  }

  loadMeters() {
    this.meters$ = this.meterService.getMeters().pipe(
      map(meters => meters.map(m => {
        const shortDate = m.installation_date ? m.installation_date.substring(0, 10) : '-';
        return {
          ...m,
          installation_date: shortDate,
          active_display: m.active ? 'Sí' : 'No',
          availability: m.is_assigned ? 'ASIGNADO' : 'DISPONIBLE'
        };
      }))
    );
  }

  setupColumns() {
    this.cols = [
      { field: 'code', header: 'Código' },
      {
        field: 'type',
        header: 'Tipo',
        type: 'tag',
        tagSeverity: (val: string) => {
          switch (val?.toLowerCase()) {
            case 'consumo': return 'info';
            case 'riego': return 'warning';
            default: return 'secondary';
          }
        }
      },
      { field: 'initial_reading', header: 'Lectura Inicial' },
      { field: 'installation_date', header: 'Fecha Instalación' },
      {
        field: 'availability',
        header: 'Estado Uso',
        type: 'tag',
        tagSeverity: (val: string) => val === 'DISPONIBLE' ? 'success' : 'warn'
      }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Editar Medidor',
        command: (row: Meter) => this.onEdit(row)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'p-button-text p-button-danger',
        tooltip: 'Eliminar Medidor',
        command: (row: Meter) => this.onDelete(row)
      }
    ];
  }

  onEdit(meter: Meter) {
    this.meterForm.reset();
    const pureDateString = meter.installation_date.substring(0, 10);
    const dateParts = pureDateString.split('-');
    const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
    // Usamos emitEvent: false para que el listener de tipo no regenere el código al cargar los datos.
    this.meterForm.patchValue({
      ...meter,
      installation_date: dateObj
    }, { emitEvent: false });

    this.dialogTitle = 'Editar Medidor';
    this.displayDialog = true;
  }

  onDelete(meter: Meter) {
    if (!meter.meter_id) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el medidor ${meter.code}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.meterService.deleteMeter(meter.meter_id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Confirmado', detail: 'Medidor eliminado correctamente' });
            this.loadMeters();
          },
          error: (err) => {
            const errorMessage = err.error?.error || 'No se pudo eliminar el medidor';
            this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
            console.error(err);
          }
        });
      }
    });
  }

  openNew() {
    this.meterForm.reset({
      type: 'consumo',
      initial_reading: 1,
      active: true,
      installation_date: new Date()
    });
    this.generateMeterCode();
    this.dialogTitle = 'Nuevo Medidor';
    this.displayDialog = true;
  }

  saveMeter() {
    if (this.meterForm.invalid) {
      this.meterForm.markAllAsTouched();
      return;
    }

    const formValue = this.meterForm.getRawValue();
    if (formValue.installation_date instanceof Date && !isNaN(formValue.installation_date.getTime())) {
      const d = formValue.installation_date;
      formValue.installation_date = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    }

    const meterId = formValue.meter_id;

    if (meterId) {
      this.meterService.updateMeter(meterId, formValue).subscribe({
        next: () => {
          this.displayDialog = false;
          this.loadMeters();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Medidor actualizado correctamente' });
        },
        error: (err) => {
          const errorMessage = err.error?.error || 'Error al actualizar medidor';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
        }
      });
    } else {
      delete formValue.meter_id;
      this.meterService.createMeter(formValue).subscribe({
        next: () => {
          this.displayDialog = false;
          this.loadMeters();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Medidor creado correctamente' });
        },
        error: (err) => {
          const errorMessage = err.error?.error || 'Error al crear medidor';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage });
        }
      });
    }
  }

  onCancel() {
    this.displayDialog = false;
  }
}
