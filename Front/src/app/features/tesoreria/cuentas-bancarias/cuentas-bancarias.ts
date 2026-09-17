import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm.service';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BankAccountsService, BankAccount } from '../../../core/services/bank-accounts.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-cuentas-bancarias',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomTable,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './cuentas-bancarias.html'
})
export default class CuentasBancariasComponent implements OnInit {
  private bankService = inject(BankAccountsService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmService);
  private messageService = inject(MessageService);

  accounts$!: Observable<BankAccount[]>;
  cols: any[] = [];
  actions: TableAction[] = [];

  accountDialog: boolean = false;
  dialogTitle: string = 'Nueva Cuenta';
  isEdit: boolean = false;

  accountForm: FormGroup = this.fb.group({
    account_id: [null],
    bank_name: ['', Validators.required],
    account_number: ['', Validators.required],
    account_type: ['savings', Validators.required],
    initial_balance: [0],
    status: ['active']
  });

  accountTypes = [
    { label: 'Ahorros', value: 'savings' },
    { label: 'Corriente', value: 'checking' }
  ];

  statusOptions = [
    { label: 'Activa', value: 'active' },
    { label: 'Inactiva', value: 'inactive' }
  ];

  ecuadorBanks = [
    // Bancos Privados y Públicos
    { label: 'Banco Pichincha', value: 'Banco Pichincha' },
    { label: 'Banco del Pacífico', value: 'Banco del Pacífico' },
    { label: 'Banco de Guayaquil', value: 'Banco de Guayaquil' },
    { label: 'Produbanco', value: 'Produbanco' },
    { label: 'Banco Bolivariano', value: 'Banco Bolivariano' },
    { label: 'Banco Internacional', value: 'Banco Internacional' },
    { label: 'Banco del Austro', value: 'Banco del Austro' },
    { label: 'Banco Solidario', value: 'Banco Solidario' },
    { label: 'Banco General Rumiñahui', value: 'Banco General Rumiñahui' },
    { label: 'Banco de Loja', value: 'Banco de Loja' },
    { label: 'Banco de Machala', value: 'Banco de Machala' },
    { label: 'Banco ProCredit', value: 'Banco ProCredit' },
    { label: 'Banco Amazonas', value: 'Banco Amazonas' },
    { label: 'Banco Capital', value: 'Banco Capital' },
    { label: 'Banco Comercial de Manabí', value: 'Banco Comercial de Manabí' },
    { label: 'Banco Coopnacional', value: 'Banco Coopnacional' },
    { label: 'Banco Delbank', value: 'Banco Delbank' },
    { label: 'Banco D-Miro', value: 'Banco D-Miro' },
    { label: 'Banco Finca', value: 'Banco Finca' },
    { label: 'Banco Litoral', value: 'Banco Litoral' },
    { label: 'Banco VisionFund', value: 'Banco VisionFund' },
    { label: 'BanEcuador', value: 'BanEcuador' },
    { label: 'Banco de Desarrollo del Ecuador (BDE)', value: 'Banco de Desarrollo del Ecuador (BDE)' },
    { label: 'BIESS', value: 'BIESS' },
    // Cooperativas de Ahorro y Crédito
    { label: 'Cooperativa JEP', value: 'Cooperativa JEP' },
    { label: 'Cooperativa Policía Nacional', value: 'Cooperativa Policía Nacional' },
    { label: 'Cooperativa Alianza del Valle', value: 'Cooperativa Alianza del Valle' },
    { label: 'Cooperativa 29 de Octubre', value: 'Cooperativa 29 de Octubre' },
    { label: 'Cooperativa Andalucía', value: 'Cooperativa Andalucía' },
    { label: 'Cooperativa Atuntaqui', value: 'Cooperativa Atuntaqui' },
    { label: 'Cooperativa Ambato', value: 'Cooperativa Ambato' },
    { label: 'Cooperativa Cacpeco', value: 'Cooperativa Cacpeco' },
    { label: 'Cooperativa Calceta', value: 'Cooperativa Calceta' },
    { label: 'Cooperativa Chibuleo', value: 'Cooperativa Chibuleo' },
    { label: 'Cooperativa COAC 15 de Abril', value: 'Cooperativa COAC 15 de Abril' },
    { label: 'Cooperativa Cooprogreso', value: 'Cooperativa Cooprogreso' },
    { label: 'Cooperativa Cotocollao', value: 'Cooperativa Cotocollao' },
    { label: 'Cooperativa Daquilema', value: 'Cooperativa Daquilema' },
    { label: 'Cooperativa El Sagrario', value: 'Cooperativa El Sagrario' },
    { label: 'Cooperativa Erco', value: 'Cooperativa Erco' },
    { label: 'Cooperativa Fasquil', value: 'Cooperativa Fasquil' },
    { label: 'Cooperativa Jardín Azuayo', value: 'Cooperativa Jardín Azuayo' },
    { label: 'Cooperativa Kullki Wasi', value: 'Cooperativa Kullki Wasi' },
    { label: 'Cooperativa La Benéfica', value: 'Cooperativa La Benéfica' },
    { label: 'Cooperativa Mushuc Runa', value: 'Cooperativa Mushuc Runa' },
    { label: 'Cooperativa Oscus', value: 'Cooperativa Oscus' },
    { label: 'Cooperativa Pablo Muñoz Vega', value: 'Cooperativa Pablo Muñoz Vega' },
    { label: 'Cooperativa Pilahuin Tio', value: 'Cooperativa Pilahuin Tio' },
    { label: 'Cooperativa Riobamba', value: 'Cooperativa Riobamba' },
    { label: 'Cooperativa San Francisco de Asís', value: 'Cooperativa San Francisco de Asís' },
    { label: 'Cooperativa San José', value: 'Cooperativa San José' },
    { label: 'Cooperativa Santa Rosa', value: 'Cooperativa Santa Rosa' },
    { label: 'Cooperativa Tulcán', value: 'Cooperativa Tulcán' },
    // Mutualistas
    { label: 'Mutualista Pichincha', value: 'Mutualista Pichincha' },
    { label: 'Mutualista Azuay', value: 'Mutualista Azuay' },
    { label: 'Mutualista Imbabura', value: 'Mutualista Imbabura' },
    { label: 'Mutualista Ambato', value: 'Mutualista Ambato' }
  ];

  ngOnInit() {
    this.setupColumns();
    this.setupActions();
    this.loadAccounts();
  }

  loadAccounts() {
    this.accounts$ = this.bankService.getAllAccounts();
  }

  setupColumns() {
    this.cols = [
      { field: 'bank_name', header: 'Banco' },
      { field: 'account_number', header: 'No. Cuenta' },
      { 
        field: 'account_type', 
        header: 'Tipo',
        format: (val: any) => val === 'savings' ? 'Ahorros' : 'Corriente'
      },
      { 
        field: 'current_balance', 
        header: 'Saldo Actual',
        type: 'currency'
      },
      { 
        field: 'status', 
        header: 'Estado',
        format: (val: any) => val === 'active' ? 'Activa' : 'Inactiva'
      }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Editar Cuenta',
        command: (row: BankAccount) => this.editAccount(row)
      }
    ];
  }

  openNew() {
    this.accountForm.reset({ account_type: 'savings', status: 'active', initial_balance: 0 });
    this.isEdit = false;
    this.dialogTitle = 'Nueva Cuenta';
    this.accountDialog = true;
  }

  editAccount(acc: BankAccount) {
    this.accountForm.patchValue(acc);
    this.isEdit = true;
    this.dialogTitle = 'Editar Cuenta';
    this.accountDialog = true;
  }

  hideDialog() {
    this.accountDialog = false;
  }

  saveAccount() {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const accountData = this.accountForm.getRawValue();

    if (this.isEdit && accountData.account_id) {
      this.bankService.updateAccount(accountData.account_id, accountData).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Éxito', detail:'Cuenta actualizada'});
          this.loadAccounts();
          this.accountDialog = false;
        },
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error al actualizar'})
      });
    } else {
      delete accountData.account_id;
      this.bankService.createAccount(accountData).subscribe({
        next: () => {
          this.messageService.add({severity:'success', summary:'Éxito', detail:'Cuenta creada'});
          this.loadAccounts();
          this.accountDialog = false;
        },
        error: () => this.messageService.add({severity:'error', summary:'Error', detail:'Error al crear'})
      });
    }
  }
}
