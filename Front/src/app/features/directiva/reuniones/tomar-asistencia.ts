import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AttendanceService, UserAttendance } from '../../../core/services/attendance.service';
import { MeetingsService, Meeting } from '../../../core/services/meetings.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-tomar-asistencia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    CardModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    RadioButtonModule
  ],
  providers: [MessageService],
  templateUrl: './tomar-asistencia.html',
  styleUrl: './tomar-asistencia.css'
})
export class TomarAsistencia implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private attendanceService = inject(AttendanceService);
  private meetingsService = inject(MeetingsService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private confirm = inject(ConfirmService);
  private original = new Map<number, string>();
  private fingerprint(item: UserAttendance): string {
    return JSON.stringify([item.attended, (item.observations || '').trim()]);
  }

  meetingId!: number;
  meeting: Meeting | null = null;
  attendanceList: UserAttendance[] = [];
  loading: boolean = false;
  saving: boolean = false;

  stats = {
    total: 0,
    present: 0,
    absent: 0,
    justified: 0
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.meetingId = parseInt(idParam);
      this.loadMeetingDetails();
      this.loadAttendanceList();
    } else {
      this.router.navigate(['/layout/reuniones']);
    }
  }

  loadMeetingDetails() {
    this.meetingsService.getMeeting(this.meetingId).subscribe({
      next: (meeting) => {
        this.meeting = meeting;
        this.cdr.markForCheck();
      },
      error: () => {
        this.showError('No se pudo cargar los detalles de la reunión');
      }
    });
  }

  loadAttendanceList() {
    this.loading = true;
    this.attendanceService.getAttendanceByMeeting(this.meetingId).subscribe({
      next: (data) => {
        this.attendanceList = data;
        this.original = new Map(data.filter(u => u.attendance_id).map(u => [u.user_id, this.fingerprint(u)]));
        this.calculateStats();
        this.loading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        this.showError('No se pudo cargar la lista de usuarios');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  calculateStats() {
    this.stats.total = this.attendanceList.length;
    this.stats.present = this.attendanceList.filter(u => u.attended === 'yes').length;
    this.stats.absent = this.attendanceList.filter(u => u.attended === 'no').length;
    this.stats.justified = this.attendanceList.filter(u => u.attended === 'justified').length;
  }

  onAttendedChange() {
    this.calculateStats();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }

  saveAttendance() {
    if (this.saving || this.loading || !this.meeting) return;
    this.saving = true;
    const saveList = this.attendanceList.filter(item => !item.locked && this.original.get(item.user_id) !== this.fingerprint(item)).map(item => ({
      user_id: item.user_id,
      expected: this.original.get(item.user_id) ?? null,
      attended: item.attended,
      observations: item.observations
    }));

    if (!saveList.length) { this.saving = false; this.showError('No hay cambios habilitados para guardar'); return; }
    const payload = { records: saveList, application_month: this.meeting.application_month };
    this.attendanceService.preview(this.meetingId, payload).pipe(
      timeout(30000),
      finalize(() => { this.saving = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: (preview) => {
        this.saving = false;
        this.confirm.confirm({
          header: 'Revisar asistencia y multas',
          message: `Mes de factura: ${preview.application_month}. Cambios: ${preview.changes}. Multas nuevas: ${preview.added} ($${Number(preview.added_amount).toFixed(2)}). Multas que se retiran: ${preview.removed}. No se modificará ningún cobro vigente.`,
          inputLabel: 'Motivo del registro o corrección', inputMinLength: 5,
          acceptLabel: 'Guardar asistencia',
          accept: (reason) => {
            if (this.saving) return;
            this.saving = true;
            this.cdr.markForCheck();
            this.attendanceService.updateAttendanceBulk(this.meetingId, {...payload, reason}).pipe(
              finalize(() => { this.saving = false; this.cdr.markForCheck(); })
            ).subscribe({
              next: () => { this.saving = false; this.showSuccess('Asistencia guardada con historial'); this.loadAttendanceList(); },
              error: err => { this.saving = false; this.showError(err.error?.message || err.error?.error || 'No se guardó la asistencia'); }
            });
          }
        });
      },
      error: (err) => {
        this.showError(err.name === 'TimeoutError' ? 'La revisión tardó demasiado. No se envió el guardado. Intente nuevamente.' : err.error?.message || err.error?.error || 'Error al revisar la asistencia');
        this.saving = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/layout/reuniones']);
  }

  private showSuccess(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
  }

  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Atención', detail: msg, life: 5000 });
  }
}
