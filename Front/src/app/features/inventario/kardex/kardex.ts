import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService, InventoryItem, InventoryMovement } from '../../../core/services/inventory';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './kardex.html',
  styleUrls: ['./kardex.css']
})
export class Kardex implements OnInit {
  item: InventoryItem | null = null;
  movements: InventoryMovement[] = [];
  itemId!: number;

  showForm = false;
  form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private inventoryService: InventoryService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      movement_type: ['in', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_cost: [0, [Validators.required, Validators.min(0)]],
      reference: [''],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.params['id']);
    this.loadData();
  }

  loadData() {
    this.inventoryService.getItemById(this.itemId).subscribe(data => {
      this.item = data;
    });
    this.inventoryService.getMovements(this.itemId).subscribe(data => {
      this.movements = data;
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const payload = {
        ...this.form.value,
        item_id: this.itemId
      };
      
      this.inventoryService.createMovement(payload).subscribe({
        next: () => {
          this.loadData();
          this.showForm = false;
          this.form.reset({ movement_type: 'in', quantity: 1, unit_cost: 0 });
        },
        error: (err) => {
          alert(err.error?.error || 'Error al registrar el movimiento');
        }
      });
    }
  }
}
