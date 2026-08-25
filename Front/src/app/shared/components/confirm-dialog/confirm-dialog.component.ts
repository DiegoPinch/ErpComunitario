import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ConfirmService, ConfirmOptions } from './confirm.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  visible = false;
  options: ConfirmOptions | null = null;
  private sub!: Subscription;

  constructor(private confirmService: ConfirmService) {}

  ngOnInit() {
    this.sub = this.confirmService.confirm$.subscribe(opts => {
      this.options = opts;
      this.visible = true;
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  accept() {
    this.visible = false;
    if (this.options?.accept) {
      this.options.accept();
    }
  }

  reject() {
    this.visible = false;
  }
}
