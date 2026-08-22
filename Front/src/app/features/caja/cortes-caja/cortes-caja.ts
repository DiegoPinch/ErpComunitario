import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmationService } from 'primeng/api';
import { AccountingPeriodsService, AccountingPeriod } from '../../../core/services/accounting-periods';
import { AdministrationsService, Administration } from '../../../core/services/administrations';
import { FinancialService } from '../../../core/services/financial.service';

@Component({
  selector: 'app-cortes-caja',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, ConfirmDialogModule, InputNumberModule],
  providers: [ConfirmationService],
  templateUrl: './cortes-caja.html',
  styleUrls: ['./cortes-caja.css']
})
export class CortesCaja implements OnInit {
  periods: AccountingPeriod[] = [];
  activeAdmin: Administration | null = null;
  currentSystemBalance: number = 0;
  
  showForm = false;
  form: FormGroup;

  constructor(
    private periodsService: AccountingPeriodsService,
    private adminService: AdministrationsService,
    private financialService: FinancialService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      physical_balance: [0, Validators.required],
      observations: ['']
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.loadPeriods();
      this.adminService.getActive().subscribe(admin => {
        this.activeAdmin = admin;
        this.cdr.detectChanges();
      });
      this.financialService.getBalance().subscribe(data => {
        this.currentSystemBalance = data.balance.global;
        this.cdr.detectChanges();
      });
    }, 0);
  }

  loadPeriods() {
    this.periodsService.getAll().subscribe(data => {
      this.periods = data;
      this.cdr.detectChanges();
    });
  }

  openForm() {
    this.form.reset({ physical_balance: 0 });
    this.form.get('start_date')?.enable();

    if (this.periods && this.periods.length > 0) {
      const latestPeriod = this.periods[0];
      if (latestPeriod && latestPeriod.end_date) {
        const nextDate = new Date(latestPeriod.end_date);
        nextDate.setDate(nextDate.getDate() + 1);
        const formattedDate = nextDate.toISOString().split('T')[0];
        
        this.form.patchValue({ start_date: formattedDate });
        this.form.get('start_date')?.disable();
      }
    }

    this.showForm = true;
  }

  onSubmit(event: Event) {
    if (this.form.valid && this.activeAdmin) {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: '¿Está seguro de generar este Corte Contable? Esta acción no se puede deshacer ni editar posteriormente.',
        header: 'Confirmación de Corte',
        icon: 'pi pi-exclamation-triangle',
        acceptIcon: 'none',
        rejectIcon: 'none',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => {
          const data = {
            ...this.form.getRawValue(),
            administration_id: this.activeAdmin!.administration_id
          };
          
          this.periodsService.generate(data).subscribe(() => {
            this.loadPeriods();
            this.showForm = false;
            this.form.reset();
          });
        }
      });
    }
  }
}
