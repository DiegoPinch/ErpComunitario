import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, NgxExtendedPdfViewerModule],
  templateUrl: './pdf-preview.html',
  styleUrls: ['./pdf-preview.css']
})
export class PdfPreview implements OnChanges {
  @Input() url: string = '';
  @Input() title: string = 'Vista Previa del Reporte';
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  currentUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['url'] && this.url) {
      this.currentUrl = this.url;
    } else if (changes['visible'] && !this.visible) {
      this.currentUrl = null;
    }
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.currentUrl = null;
  }
}
