import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListboxModule } from 'primeng/listbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, catchError, of } from 'rxjs';
import { ReadingsService } from '../../../core/services/readings.service';
import { UserAssignmentStatus, ReadingStatus, LatestReadingResponse, CurrentReadingResponse } from '../../../core/models/reading.model';

@Component({
  selector: 'app-ingreso-lecturas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ListboxModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    TagModule,
    DialogModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './ingreso-lecturas.html',
  styleUrl: './ingreso-lecturas.css',
})
export class IngresoLecturas implements OnInit {
  private readingsService = inject(ReadingsService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  selectedMonth: string = '';
  availableMonths: { label: string, value: string }[] = [];

  // Usuarios agrupados con sus medidores
  users: UserAssignmentStatus[] = [];
  selectedUser: UserAssignmentStatus | null = null;

  // Medidor seleccionado para ingreso
  selectedMeter: ReadingStatus | null = null;

  // Cache de lecturas anteriores para el usuario seleccionado
  meterReadingsCache: Map<number, LatestReadingResponse> = new Map();

  // Datos de lectura (para el medidor actual)
  previousReadingData: LatestReadingResponse | null = null;
  currentReadingData: CurrentReadingResponse | null = null;
  currentReading: number | null = null;
  isEditable: boolean = true;
  totalAmount: number = 0;

  ngOnInit(): void {
    this.generateAvailableMonths();
    this.loadUsersAndStatus();
  }

  //formato para la lectura anterior
  getFormattedPreviousMonth(): string {
    if (!this.previousReadingData) return '---';

    if (this.previousReadingData.source === 'initial') {
      return 'LECT. INICIAL';
    }
    const [year, month] = this.previousReadingData.month_year.split('-');
    const monthNames = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];

    const monthIndex = parseInt(month, 10) - 1;
    return `${year}-${monthNames[monthIndex] || month}`;
  }

  generateAvailableMonths() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    this.availableMonths = [];
    for (let i = 0; i <= currentMonth; i++) {
      const monthNum = (i + 1).toString().padStart(2, '0');
      this.availableMonths.push({
        label: `${monthNames[i]} ${currentYear}`,
        value: `${currentYear}-${monthNum}`
      });
    }

    this.selectedMonth = this.availableMonths[this.availableMonths.length - 1].value;
  }

  onMonthChange() {
    this.selectedUser = null;
    this.selectedMeter = null;
    this.previousReadingData = null;
    this.currentReadingData = null;
    this.currentReading = null;
    this.totalAmount = 0;
    this.isEditable = true;
    this.meterReadingsCache.clear();
    this.loadUsersAndStatus();
  }

  // Hacer ambas llamadas en PARALELO para reducir tiempo de carga
  loadUsersAndStatus() {
    forkJoin({
      users: this.readingsService.getAssignmentStatus(),
      readings: this.readingsService.getReadingsByMonth(this.selectedMonth)
    }).subscribe({
      next: ({ users, readings }) => {
        users.forEach(user => {
          user.meters.forEach(meter => {
            const hasReading = readings.find(r => r.meter_id === meter.meter_id);
            meter.status = hasReading ? 'completed' : 'pending';
          });
        });
        this.users = users;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
      }
    });
  }

  onSelectUser(event: any) {
    this.selectedUser = event.value;
    this.selectedMeter = null;
    this.previousReadingData = null;
    this.currentReading = null;
    this.meterReadingsCache.clear();

    if (this.selectedUser) {
      const requests = this.selectedUser.meters.map(m =>
        this.readingsService.getLatestReading(m.meter_id, this.selectedMonth).pipe(
          catchError(() => of(null))
        )
      );

      if (requests.length > 0) {
        forkJoin(requests).subscribe({
          next: (results) => {
            results.forEach((data, index) => {
              if (data && this.selectedUser) {
                const meterId = this.selectedUser.meters[index].meter_id;
                this.meterReadingsCache.set(meterId, data);
              }
            });
            this.cdr.detectChanges();
          }
        });
      }
    }
    this.cdr.detectChanges();
  }

  // Seleccionar medidor
  onSelectMeter(meter: ReadingStatus) {
    this.selectedMeter = meter;
    this.currentReading = null;
    this.currentReadingData = null;
    this.previousReadingData = null; // Limpiar antes de cargar
    this.isEditable = true;
    this.totalAmount = 0;

    if (this.meterReadingsCache.has(meter.meter_id)) {
      this.previousReadingData = this.meterReadingsCache.get(meter.meter_id)!;
    } else {
      this.readingsService.getLatestReading(meter.meter_id, this.selectedMonth).subscribe({
        next: (data) => {
          this.previousReadingData = data;
          this.cdr.detectChanges();
        }
      });
    }

    // 2. Traer la lectura ACTUAL (si existe) para edición
    this.readingsService.getCurrentReading(meter.meter_id, this.selectedMonth).subscribe({
      next: (current) => {
        this.currentReadingData = current;
        if (current) {
          this.currentReading = current.current_reading;
          this.totalAmount = current.amount;
          this.isEditable = current.invoice_status !== 'paid';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.currentReadingData = null;
        this.cdr.detectChanges();
      }
    });

    this.cdr.detectChanges();
  }

  getTotalMeters(user: UserAssignmentStatus): number {
    return user.meters.length;
  }

  getPendingMeters(user: UserAssignmentStatus): number {
    return user.meters.filter(m => m.status === 'pending').length;
  }

  get stats() {
    const allMeters = this.users.flatMap(u => u.meters);
    return {
      total: allMeters.length,
      completed: allMeters.filter(m => m.status === 'completed').length,
      pending: allMeters.filter(m => m.status === 'pending').length
    };
  }

  getUserInitials(userName: string): string {
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  //guardar lectura 
  onSaveReading() {
    if (!this.selectedUser || !this.selectedMeter || this.currentReading === null) return;

    const request = {
      user_id: this.selectedUser.user_id,
      meter_id: this.selectedMeter.meter_id,
      month_year: this.selectedMonth,
      current_reading: this.currentReading
    };

    this.readingsService.processReading(request).subscribe({
      next: (response) => {
        if (this.selectedMeter) this.selectedMeter.status = 'completed';
        if (response.result && response.result[0] && response.result[0][0]) {
          this.totalAmount = response.result[0][0].reading_amount || 0;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Lectura guardada correctamente.'
        });

        this.loadUsersAndStatus();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la lectura.'
        });
        this.cdr.detectChanges();
      }
    });
  }
}
