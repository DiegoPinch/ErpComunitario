import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InventoryService, InventoryItem } from '../../../core/services/inventory';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-list-inventario',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CustomTable, DialogModule, ButtonModule],
  templateUrl: './list-inventario.html',
  styleUrls: ['./list-inventario.css']
})
export class ListInventario implements OnInit {
  items: any[] = [];
  columns: any[] = [];
  actions: TableAction[] = [];

  showForm = false;
  isEditMode = false;
  editingId: number | null = null;
  form: FormGroup;

  constructor(
    private inventoryService: InventoryService, 
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      category: ['tools', Validators.required],
      description: [''],
      unit_measure: ['unit', Validators.required],
      initial_stock: [0, Validators.required],
      minimum_stock: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.setupTable();
    this.loadItems();
  }

  setupTable() {
    this.columns = [
      { field: 'code', header: 'Código' },
      { field: 'name_desc', header: 'Ítem' },
      { field: 'unit_measure', header: 'Unidad' },
      { field: 'current_stock', header: 'Stock Actual' },
      { field: 'stock_status', header: 'Estado' }
    ];

    this.actions = [
      {
        icon: 'pi pi-pencil',
        tooltip: 'Editar',
        styleClass: 'p-button-text p-button-info',
        command: (row: any) => this.editItem(row)
      },
      {
        icon: 'pi pi-list',
        tooltip: 'Ver Kardex',
        styleClass: 'p-button-text p-button-secondary font-bold underline',
        command: (row: any) => this.router.navigate(['/layout/inventario/kardex', row.item_id])
      }
    ];
  }

  loadItems() {
    this.inventoryService.getItems().subscribe(data => {
      this.items = data.map((item: any) => ({
        ...item,
        name_desc: item.name + (item.description ? ' (' + item.description + ')' : ''),
        stock_status: ((item.current_stock ?? 0) <= item.minimum_stock) ? 'Stock Bajo' : 'OK'
      }));
      this.cdr.detectChanges();
    });
  }

  editItem(item: any) {
    this.isEditMode = true;
    this.editingId = item.item_id!;
    this.showForm = true;
    this.form.patchValue(item);
  }

  openNew() {
    this.isEditMode = false;
    this.editingId = null;
    this.form.reset({ category: 'tools', unit_measure: 'unit', initial_stock: 0, minimum_stock: 0 });
    this.showForm = true;
  }

  resetForm() {
    this.showForm = false;
    this.isEditMode = false;
    this.editingId = null;
    this.form.reset({ category: 'tools', unit_measure: 'unit', initial_stock: 0, minimum_stock: 0 });
  }

  onSubmit() {
    if (this.form.valid) {
      if (this.isEditMode && this.editingId) {
        this.inventoryService.updateItem(this.editingId, this.form.value).subscribe(() => {
          this.loadItems();
          this.resetForm();
        });
      } else {
        this.inventoryService.createItem(this.form.value).subscribe(() => {
          this.loadItems();
          this.resetForm();
        });
      }
    }
  }
}
