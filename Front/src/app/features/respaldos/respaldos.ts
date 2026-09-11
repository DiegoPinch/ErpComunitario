import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-respaldos',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, ToastModule],
  providers: [MessageService],
  templateUrl: './respaldos.html',
  styleUrl: './respaldos.css'
})
export class Respaldos {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  isDownloading = false;

  descargarRespaldoSeguro() {
    this.isDownloading = true;
    this.messageService.add({ severity: 'info', summary: 'Generando', detail: 'Creando respaldo encriptado...' });

    const url = `${environment.apiUrl}/backup/download`;
    
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        
        const fecha = new Date().toISOString().slice(0,10);
        link.download = `respaldo_erp_${fecha}.enc`; 
        
        link.click();
        window.URL.revokeObjectURL(urlBlob);
        
        this.isDownloading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Respaldo descargado correctamente' });
      },
      error: (err) => {
        console.error('Error al descargar el respaldo:', err);
        this.isDownloading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el respaldo' });
      }
    });
  }

  isUploading = false;

  subirNube() {
    this.isUploading = true;
    this.messageService.add({ severity: 'info', summary: 'Enviando', detail: 'Enviando respaldo por correo...' });

    const url = `${environment.apiUrl}/backup/send-email`;
    
    this.http.post(url, {}).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Respaldo enviado a tu correo' });
      },
      error: (err) => {
        this.isUploading = false;
        const msg = err.error?.details || 'Error al enviar el correo';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        console.error('Error Correo:', err);
      }
    });
  }
}
