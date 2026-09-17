import {Component,ChangeDetectorRef,OnDestroy,inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {environment} from '../../../environments/environment';
@Component({selector:'app-portal',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./portal.html',styleUrl:'./portal.css'})
export class Portal implements OnDestroy{
  cedula='';data:any=null;selected:any=null;loading=false;error='';tab='facturas';
  filter='pendientes';page=1;
  get invoices(){return (this.data?.invoices||[]).filter((i:any)=>this.filter==='todas'||(this.filter==='pendientes'?i.remaining>0:i.status!=='cancelled'&&i.remaining===0));}
  get visibleInvoices(){return this.invoices.slice((this.page-1)*8,this.page*8);}
  get pages(){return Math.max(1,Math.ceil(this.invoices.length/8));}
  get pendingCount(){return (this.data?.invoices||[]).filter((i:any)=>i.remaining>0).length;}
  monthLabel(value:string){if(!value)return 'Sin mes';const [y,m]=value.split('-').map(Number);return new Intl.DateTimeFormat('es',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));}
  openInvoice(invoice:any){this.selected=invoice;setTimeout(()=>document.getElementById('invoice-detail')?.scrollIntoView({behavior:'smooth',block:'start'}));}
  private http=inject(HttpClient);private cdr=inject(ChangeDetectorRef);private request?:Subscription;private expiry?:ReturnType<typeof setTimeout>;
  get total(){return this.data ? (this.data.invoices.reduce((s:number,i:any)=>s+Math.round(i.remaining*100),0)+this.data.debts.reduce((s:number,d:any)=>s+Math.round(d.remaining*100),0))/100:0;}
  consult(){
    if(this.loading)return;
    this.data=null;this.selected=null;this.error='';clearTimeout(this.expiry);
    if(!/^\d{10}$/.test(this.cedula.trim())){this.error='Ingrese una cédula de 10 dígitos.';return;}
    this.loading=true;
    this.request=this.http.post<any>(`${environment.apiUrl}/portal/consulta`,{cedula:this.cedula.trim()}).subscribe({next:d=>{
      this.data=d;this.cedula='';this.loading=false;this.tab='facturas';this.filter='pendientes';this.page=1;
      this.expiry=setTimeout(()=>{this.clear();this.cdr.markForCheck();},10*60*1000);this.cdr.markForCheck();
    },error:e=>{this.loading=false;this.error=e.error?.error||'No se pudo consultar.';this.cdr.markForCheck();}});
  }
  clear(){this.request?.unsubscribe();clearTimeout(this.expiry);this.data=null;this.selected=null;this.cedula='';this.error='';this.loading=false;}
  status(i:any){return i.status==='cancelled'?'Anulada':i.remaining>0?(i.paid>0?'Abono parcial':'Pendiente'):i.paid>0?'Pagada':'Sin saldo';}
  print(){window.print();}
  ngOnDestroy(){this.clear();}
}
