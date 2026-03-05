import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ExpenseCategoryService } from '../../../core/services/expense-category.service';
import { CustomTable } from '../../../shared/components/tables/custom-table/custom-table';
import { ExpenseCategory } from '../../../core/models/financial.model';
import { TableAction } from '../../../shared/components/tables/custom-table/table-action.model';

@Component({
  selector: 'app-categorias-egresos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CustomTable,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    TagModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './categorias-egresos.html',
  styleUrl: './categorias-egresos.css',
})
export class CategoriasEgresos implements OnInit {
  private categoryService = inject(ExpenseCategoryService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  categories$!: Observable<ExpenseCategory[]>;
  cols: any[] = [];
  actions: TableAction[] = [];

  // Estado del Modal
  displayDialog: boolean = false;
  dialogTitle: string = 'Nueva Categoría';

  categoryForm: FormGroup = this.fb.group({
    category_id: [null],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['']
  });

  ngOnInit() {
    this.setupColumns();
    this.setupActions();
    this.loadCategories();
  }

  loadCategories() {
    this.categories$ = this.categoryService.getCategories();
  }

  setupColumns() {
    this.cols = [
      { field: 'name', header: 'Nombre' },
      { field: 'description', header: 'Descripción' }
    ];
  }

  setupActions() {
    this.actions = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        styleClass: 'p-button-text p-button-info',
        tooltip: 'Editar Categoría',
        command: (row: ExpenseCategory) => this.onEdit(row)
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        styleClass: 'p-button-text p-button-danger',
        tooltip: 'Eliminar Categoría',
        command: (row: ExpenseCategory) => this.onDelete(row)
      }
    ];
  }

  openNew() {
    this.categoryForm.reset();
    this.dialogTitle = 'Nueva Categoría';
    this.displayDialog = true;
  }

  onEdit(category: ExpenseCategory) {
    this.categoryForm.patchValue(category);
    this.dialogTitle = 'Editar Categoría';
    this.displayDialog = true;
  }

  onDelete(category: ExpenseCategory) {
    if (!category.category_id) return;

    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la categoría "${category.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.categoryService.deleteCategory(category.category_id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Confirmado', detail: 'Categoría eliminada correctamente' });
            this.loadCategories();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar la categoría' });
          }
        });
      }
    });
  }

  saveCategory() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const categoryData = {
      ...this.categoryForm.getRawValue(),
      name: this.categoryForm.get('name')?.value?.toUpperCase(),
      description: this.categoryForm.get('description')?.value?.toUpperCase()
    };
    const categoryId = categoryData.category_id;

    if (categoryId) {
      this.categoryService.updateCategory(categoryId, categoryData).subscribe({
        next: () => {
          this.displayDialog = false;
          this.loadCategories();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría actualizada correctamente' });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar categoría' });
        }
      });
    } else {
      delete categoryData.category_id;
      this.categoryService.createCategory(categoryData).subscribe({
        next: () => {
          this.displayDialog = false;
          this.loadCategories();
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría creada correctamente' });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear categoría' });
        }
      });
    }
  }

  onCancel() {
    this.displayDialog = false;
  }
}
