import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { TomarAsistencia } from './tomar-asistencia';
import { AttendanceService } from '../../../core/services/attendance.service';
import { MeetingsService } from '../../../core/services/meetings.service';
import { ConfirmService, ConfirmOptions } from '../../../shared/components/confirm-dialog/confirm.service';

describe('Guardar asistencia', () => {
  it('libera el indicador después de revisar y guarda solo al confirmar', async () => {
    const preview = new Subject<any>();
    const save = new Subject<any>();
    let sent = false;
    let confirmation: ConfirmOptions | undefined;
    TestBed.configureTestingModule({imports: [TomarAsistencia], providers: [
      {provide: ActivatedRoute, useValue: {snapshot: {paramMap: {get: () => '1'}}}},
      {provide: Router, useValue: {}},
      {provide: MeetingsService, useValue: {getMeeting: () => of({application_month: '2026-09'})}},
      {provide: AttendanceService, useValue: {
        getAttendanceByMeeting: () => of([{user_id: 1, attended: 'no', locked: false}]),
        preview: () => preview,
        updateAttendanceBulk: () => {sent = true; return save;}
      }}
    ]});
    TestBed.overrideComponent(TomarAsistencia, {set: {template: '{{ saving ? "Cargando" : "Listo" }}'}});
    const fixture = TestBed.createComponent(TomarAsistencia);
    TestBed.inject(ConfirmService).confirm$.subscribe(value => confirmation = value);
    await fixture.whenStable();
    fixture.componentInstance.saveAttendance();
    preview.next({application_month: '2026-09', changes: 1, added: 1, added_amount: 15, removed: 0});
    preview.complete();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Listo');
    expect(sent).toBe(false);
    expect(confirmation).toBeDefined();
    confirmation!.accept('Registro de prueba');
    expect(sent).toBe(true);
    save.error({error: {error: 'Factura protegida'}});
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Listo');
    expect(fixture.componentInstance.saving).toBe(false);
  });
});
