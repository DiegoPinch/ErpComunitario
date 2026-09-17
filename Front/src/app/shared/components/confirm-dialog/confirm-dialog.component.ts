import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ConfirmService, ConfirmOptions } from './confirm.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule],
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  visible = false;
  inputValue = '';

  get inputValid() {
    return !this.options?.inputLabel || this.inputValue.trim().length >= (this.options.inputMinLength ?? 1);
  }
  options: ConfirmOptions | null = null;
  private sub!: Subscription;

  constructor(private confirmService: ConfirmService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.sub = this.confirmService.confirm$.subscribe(opts => {
      this.options = opts;
      this.inputValue = '';
      this.visible = true;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  accept() {
    if (!this.visible || !this.inputValid) return;
    this.visible = false;
    if (this.options?.accept) {
      this.options.accept(this.options.inputLabel ? this.inputValue.trim() : undefined);
    }
  }

  reject() {
    this.visible = false;
  }
}
