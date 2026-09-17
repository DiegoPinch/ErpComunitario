export interface DashboardStats {
  month: string;
  year: string;
  kpis: {income:number;expense:number;billed:number;debt:number;activeUsers:number};
  breakdown: {category:string;amount:number}[];
  history: {month:string;income:number;expense:number;billed:number;pending:number}[];
  consumption: {month:string;domestic_consumption:number;irrigation_consumption:number}[];
  debtors: {name:string;total_amount:number;months:number}[];
}
