import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmOptions {
  header?: string;
  message: string;
  acceptLabel?: string;
  rejectLabel?: string;
  accept: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private confirmSubject = new Subject<ConfirmOptions>();
  confirm$ = this.confirmSubject.asObservable();

  confirm(options: ConfirmOptions) {
    this.confirmSubject.next(options);
  }
}
