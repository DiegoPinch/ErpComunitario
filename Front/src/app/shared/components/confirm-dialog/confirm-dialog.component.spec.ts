import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmService } from './confirm.service';

describe('Confirmación recibida después de una petición', () => {
  it('exige motivo, ejecuta una sola vez y no ejecuta al cancelar', async () => {
    TestBed.configureTestingModule({imports: [ConfirmDialogComponent]});
    TestBed.overrideComponent(ConfirmDialogComponent, {set: {template: ''}});
    const fixture=TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();
    const service=TestBed.inject(ConfirmService);
    let calls=0;
    service.confirm({message:'Anular',inputLabel:'Motivo',inputMinLength:5,accept:reason=>{expect(reason).toBe('Corrección');calls++;}});
    fixture.componentInstance.inputValue='abc';
    fixture.componentInstance.accept();
    expect(calls).toBe(0);
    fixture.componentInstance.inputValue=' Corrección ';
    fixture.componentInstance.accept();
    fixture.componentInstance.accept();
    expect(calls).toBe(1);
    service.confirm({message:'Eliminar',accept:()=>calls++});
    fixture.componentInstance.reject();
    fixture.componentInstance.accept();
    expect(calls).toBe(1);
  });
  it('muestra el diálogo sin necesitar otro clic en la pantalla', async () => {
    TestBed.configureTestingModule({imports: [ConfirmDialogComponent]});
    TestBed.overrideComponent(ConfirmDialogComponent, {set: {
      template: '@if (visible) { <div>{{ options?.header }}</div> }'
    }});
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();
    await Promise.resolve();
    TestBed.inject(ConfirmService).confirm({header: 'Revisar asistencia', message: 'Prueba', accept: () => {}});
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Revisar asistencia');
  });
});
