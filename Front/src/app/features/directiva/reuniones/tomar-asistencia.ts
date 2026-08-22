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
        this.calculateStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showError('No se pudo cargar la lista de usuarios');
        this.loading = false;
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
    this.saving = true;
    const saveList = this.attendanceList.map(item => ({
      user_id: item.user_id,
      attended: item.attended,
      observations: item.observations
    }));

    this.attendanceService.updateAttendanceBulk(this.meetingId, saveList).subscribe({
      next: () => {
        this.showSuccess('Asistencia y multas registradas con éxito');
        this.saving = false;
        // Reload to update invoice statuses
        this.loadAttendanceList();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Error al guardar la asistencia');
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
