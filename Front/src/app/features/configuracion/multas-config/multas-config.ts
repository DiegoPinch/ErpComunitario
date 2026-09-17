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
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, map } from 'rxjs';
import { FineConfigurationsService, FineConfiguration } from '../../../core/services/fine-configurations.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-multas-config',
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
    CardModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './multas-config.html',
  styleUrl: './multas-config.css',
})
export class MultasConfig implements OnInit {
  private configsService = inject(FineConfigurationsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  configs$!: Observable<any[]>;
  cols: any[] = [];
  actions: TableAction[] = [];

  configDialog: boolean = false;
  configForm: FormGroup = this.fb.group({
    config_id: [null],
    name: ['', Validators.required],
    fine_type: ['session', Validators.required],
    default_amount: [null, [Validators.required, Validators.min(0)]],
    description: ['']
  });

  fineTypes = [
    { label: 'Sesión Ordinaria/Extraordinaria', value: 'session' },
    { label: 'Minga Comunitaria', value: 'minga' }
  ];

  ngOnInit(): void {
    this.setupColumns();
    this.setupActions();
    this.loadConfigs();
  }

  loadConfigs() {
    this.configs$ = this.configsService.getConfigs().pipe(
      map(configs => configs.map(c => ({
        ...c,
        amount_display: `$${parseFloat(c.default_amount.toString()).toFixed(2)}`,
        type_display: c.fine_type === 'minga' ? 'MINGA' : 'SESIÓN'
      })))
    );
  }

  setupColumns() {
    this.cols = [
      { field: 'name', header: 'Nombre de Tarifa' },
      {
        field: 'type_display',
        header: 'Tipo Aplicable',
        type: 'tag',
        tagSeverity: (val: string) => val === 'MINGA' ? 'warning' : 'success'
      },
      { field: 'amount_display', header: 'Monto por Defecto' },
      { field: 'description', header: 'Descripción' }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Editar Tarifa',
        command: (row: FineConfiguration) => this.editConfig(row)
      }
    ];
  }

  openNew() {
    this.configForm.reset({
      config_id: null,
      name: '',
      fine_type: 'session',
      default_amount: null,
      description: ''
    });
    this.configDialog = true;
  }

  editConfig(config: FineConfiguration) {
    this.configForm.patchValue(config);
    this.configDialog = true;
  }

  saveConfig() {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    const configData = this.configForm.getRawValue();
    const id = configData.config_id;

    if (id) {
      this.configsService.updateConfig(id, configData).subscribe({
        next: () => {
          this.showSuccess('Configuración de multa actualizada correctamente');
          this.loadConfigs();
          this.configDialog = false;
        },
        error: (err) => this.showError(err.error?.message || 'Error al actualizar')
      });
    } else {
      this.configsService.createConfig(configData).subscribe({
        next: () => {
          this.showSuccess('Configuración de multa creada correctamente');
          this.loadConfigs();
          this.configDialog = false;
        },
        error: (err) => this.showError(err.error?.message || 'Error al crear')
      });
    }
  }

  private showSuccess(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
  }

  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Atención', detail: msg, life: 5000 });
  }
}
