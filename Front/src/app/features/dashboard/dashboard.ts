import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../core/models/dashboard.model';

@Component({selector:'app-dashboard',standalone:true,imports:[CommonModule,FormsModule,ChartModule],templateUrl:'./dashboard.html',styleUrl:'./dashboard.css'})
export class Dashboard implements OnInit, OnDestroy {
  month=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit'}).format(new Date());
  maxMonth=this.month;
  data:DashboardStats|null=null;
  loading=false;
  error='';
  revenueData:any;
  consumptionData:any;
  chartOptions={maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:7,padding:18,font:{size:11},color:'#64748b'}}},scales:{x:{grid:{display:false},ticks:{font:{size:10},color:'#94a3b8'}},y:{beginAtZero:true,border:{display:false},grid:{color:'#f1f5f9'},ticks:{font:{size:10},color:'#94a3b8'}}}};
  private request?:Subscription;
  constructor(private service:DashboardService,private cdr:ChangeDetectorRef){}
  ngOnInit(){this.loadDashboardData();}
  ngOnDestroy(){this.request?.unsubscribe();}
  loadDashboardData(){
    this.request?.unsubscribe();
    this.data=null;this.error='';this.loading=false;
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(this.month)||this.month>this.maxMonth){this.error='Seleccione un mes válido, no futuro.';return;}
    this.loading=true;
    this.request=this.service.getStats(this.month).subscribe({next:data=>{
      this.data=data;this.loading=false;
      const labels=Array.from({length:12},(_,i)=>new Intl.DateTimeFormat('es',{month:'short'}).format(new Date(2020,i,1)));
      this.revenueData={labels,datasets:[{label:'Cobrado de las facturas ($)',data:data.history.map(r=>r.income),backgroundColor:'#2563eb',borderRadius:4},{label:'Pendiente de esas facturas ($)',data:data.history.map(r=>r.pending),backgroundColor:'#f59e0b',borderRadius:4}]};
      this.consumptionData={labels,datasets:[{label:'Consumo doméstico (m³)',data:data.consumption.map(r=>r.domestic_consumption),borderColor:'#2563eb',tension:0},{label:'Riego (m³)',data:data.consumption.map(r=>r.irrigation_consumption),borderColor:'#8b5cf6',tension:0}]};
      this.cdr.markForCheck();
    },error:err=>{this.loading=false;this.error=err.error?.error||'No se pudo cargar el resumen. Intente nuevamente.';this.cdr.markForCheck();}});
  }
}
