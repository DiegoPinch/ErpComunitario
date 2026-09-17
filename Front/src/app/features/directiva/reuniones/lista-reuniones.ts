import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { MeetingsService, Meeting } from '../../../core/services/meetings.service';
import { FineConfigurationsService, FineConfiguration } from '../../../core/services/fine-configurations.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-lista-reuniones',
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
  templateUrl: './lista-reuniones.html',
  styleUrl: './lista-reuniones.css'
})
export class ListaReuniones implements OnInit {
  private meetingsService = inject(MeetingsService);
  private configsService = inject(FineConfigurationsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  meetings$!: Observable<any[]>;
  cols: any[] = [];
  actions: TableAction[] = [];

  meetingDialog: boolean = false;
  billingMonths: {value:string;label:string;disabled:boolean;reason:string|null}[] = [];
  financialLocked = false;
  monthsLoading = false;
  get hasBlockedMonths(): boolean {
    return this.billingMonths.some(month => Boolean(month.reason));
  }
  loadBillingMonths(savedMonth?: string) {
    this.monthsLoading = true;
    this.billingMonths = [];
    this.meetingsService.getBillingMonths().subscribe({
      next: months => {
        this.billingMonths = months;
        if (savedMonth && !months.some(m=>m.value===savedMonth)) {
          this.billingMonths.push({value:savedMonth,label:`${savedMonth} (registrado)`,disabled:true,reason:null});
        }
        this.monthsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.monthsLoading=false; this.showError('No se pudieron verificar los meses disponibles. Cierre y abra el formulario.'); this.cdr.markForCheck(); }
    });
  }
  meetingForm: FormGroup = this.fb.group({
    meeting_id: [null],
    reason: ['', Validators.required],
    meeting_date: ['', Validators.required],
    application_month: ['', Validators.required],
    meeting_type: ['session', Validators.required],
    fine_config_id: [null, Validators.required],
    fine_amount: [0.00],
    minutes: [''],
    notes: ['']
  });

  meetingTypes = [
    { label: 'Sesión Ordinaria/Extraordinaria', value: 'session' },
    { label: 'Minga Comunitaria', value: 'minga' }
  ];

  allFineConfigs: FineConfiguration[] = [];
  fineConfigs: { label: string, value: number, default_amount: number }[] = [];

  ngOnInit(): void {
    this.setupColumns();
    this.setupActions();
    this.loadMeetings();
    this.loadFineConfigs();

    // Subscribe to meeting type changes to filter configurations
    this.meetingForm.get('meeting_type')?.valueChanges.subscribe(type => {
      this.filterConfigs(type);
    });
  }

  loadMeetings() {
    this.meetings$ = this.meetingsService.getMeetings().pipe(
      map(meetings => meetings.map(m => ({
        ...m,
        date_display: this.formatDate(m.meeting_date),
        type_display: m.meeting_type === 'minga' ? 'MINGA' : 'SESIÓN',
        amount_display: `$${parseFloat(m.fine_amount.toString()).toFixed(2)}`
      })))
    );
  }

  loadFineConfigs() {
    this.configsService.getConfigs().subscribe({
      next: (configs) => {
        this.allFineConfigs = configs;
        this.filterConfigs(this.meetingForm.get('meeting_type')?.value || 'session');
      }
    });
  }

  filterConfigs(type: 'session' | 'minga') {
    this.fineConfigs = this.allFineConfigs
      .filter(c => c.fine_type === type)
      .map(c => ({
        label: `${c.name} ($${parseFloat(c.default_amount.toString()).toFixed(2)})`,
        value: c.config_id!,
        default_amount: c.default_amount
      }));

    // If current selection is not in the newly filtered list, clear it
    const currentConfigId = this.meetingForm.get('fine_config_id')?.value;
    if (currentConfigId && !this.fineConfigs.some(c => c.value === currentConfigId)) {
      this.meetingForm.get('fine_config_id')?.setValue(null);
      this.meetingForm.get('fine_amount')?.setValue(0.00);
    }
  }

  setupColumns() {
    this.cols = [
      { field: 'reason', header: 'Motivo / Asunto' },
      { field: 'date_display', header: 'Fecha' },
      { field: 'application_month', header: 'Mes de la multa' },
      {
        field: 'type_display',
        header: 'Tipo',
        type: 'tag',
        tagSeverity: (val: string) => val === 'MINGA' ? 'warning' : 'success'
      },
      { field: 'amount_display', header: 'Tarifa de Multa' }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Control de Asistencia',
        icon: 'pi pi-check-square',
        styleClass: 'p-button-text p-button-success',
        tooltip: 'Registrar Asistencia',
        command: (row: Meeting) => this.router.navigate([`/layout/reuniones/asistencia/${row.meeting_id}`])
      },
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Editar Reunión',
        command: (row: Meeting) => this.editMeeting(row)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'p-button-text p-button-danger',
        tooltip: 'Eliminar Reunión',
        command: (row: Meeting) => this.deleteMeeting(row)
      }
    ];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }

  onFineConfigChange(configId: number) {
    const selected = this.allFineConfigs.find(c => c.config_id === configId);
    if (selected) {
      this.meetingForm.get('fine_amount')?.setValue(selected.default_amount);
    }
  }

  openNew() {
    this.financialLocked = false;
    this.meetingForm.get('application_month')?.enable();
    this.loadBillingMonths();
    this.meetingForm.reset({
      meeting_id: null,
      application_month: '',
      reason: '',
      meeting_date: new Date().toISOString().substring(0, 10),
      meeting_type: 'session',
      fine_config_id: null,
      fine_amount: 0.00,
      minutes: '',
      notes: ''
    });
    this.meetingDialog = true;
    this.filterConfigs('session');
  }

  editMeeting(meeting: Meeting) {
    this.financialLocked = Boolean(meeting.financial_locked);
    if (this.financialLocked) this.meetingForm.get('application_month')?.disable();
    else this.meetingForm.get('application_month')?.enable();
    this.loadBillingMonths(meeting.application_month);
    const formattedMeeting = {
      ...meeting,
      meeting_date: meeting.meeting_date ? meeting.meeting_date.substring(0, 10) : ''
    };
    this.meetingForm.patchValue(formattedMeeting);
    this.filterConfigs(meeting.meeting_type);
    this.meetingDialog = true;
  }

  saveMeeting() {
    const selectedMonth=this.meetingForm.getRawValue().application_month;
    if (!this.financialLocked && (this.monthsLoading || !this.billingMonths.some(m=>m.value===selectedMonth && !m.disabled))) {
      this.showError('Seleccione un mes habilitado para las multas'); return;
    }
    if (this.meetingForm.invalid) {
      this.meetingForm.markAllAsTouched();
      return;
    }

    const meetingData = this.meetingForm.getRawValue();
    const id = meetingData.meeting_id;

    if (id) {
      this.meetingsService.updateMeeting(id, meetingData).subscribe({
        next: () => {
          this.showSuccess('Reunión actualizada y multas recalculadas');
          this.loadMeetings();
          this.meetingDialog = false;
        },
        error: (err) => this.showError(err.error?.message || err.error?.error || 'Error al actualizar reunión')
      });
    } else {
      this.meetingsService.createMeeting(meetingData).subscribe({
        next: () => {
          this.showSuccess('Reunión creada con éxito y multas configuradas');
          this.loadMeetings();
          this.meetingDialog = false;
        },
        error: (err) => this.showError(err.error?.message || err.error?.error || 'Error al crear reunión')
      });
    }
  }

  deleteMeeting(meeting: Meeting) {
    this.confirmationService.confirm({
      message: `¿Eliminar la reunión "${meeting.reason}"? Solo se permite si todavía no tiene asistencia ni multas registradas.`,
      header: 'Confirmar eliminación',
      accept: () => {
        if (meeting.meeting_id) {
          this.meetingsService.deleteMeeting(meeting.meeting_id).subscribe({
            next: () => {
              this.showSuccess('Reunión y multas asociadas eliminadas con éxito');
              this.loadMeetings();
            },
            error: (err) => this.showError(err.error?.message || err.error?.error || 'Error al eliminar reunión')
          });
        }
      }
    });
  }

  private showSuccess(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
  }

  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Atención', detail: msg, life: 6000 });
  }
}
