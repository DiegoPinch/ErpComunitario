import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { TableAction } from './table-action.model';

@Component({
  selector: 'app-custom-table',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TagModule
  ],
  templateUrl: './custom-table.html',
  styleUrl: './custom-table.css',
})
export class CustomTable {
  @Input() data: any[] = [];
  @Input() columns: any[] = [];
  @Input() title: string = '';
  @Input() showIndex: boolean = false;
  @Input() globalFilterFields: string[] = [];
  @Input() actions: TableAction[] = [];

  clear(table: Table) {
    table.clear();
  }
}
