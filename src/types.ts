export interface Card {
  id: string;
  name: string;
  brand: string;
  color: string;
  balance: number;
  dueDay: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  isSystem?: boolean;
}

export interface Transaction {
  id: string;
  monthId: string; // format: YYYY-MM
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  cardId?: string;
  ownership: 'propria' | 'terceiro';
  frequency: 'once' | 'installment';
  installmentCurrent?: number;
  installmentTotal?: number;
  paymentStatus: 'Pago' | 'A Pagar';
  notified?: boolean;
}

export interface SystemConfig {
  id: string; // 'car' | 'house'
  model: string;
  quitTodayValue: number;
  totalInstallments?: number;
  paidInstallments?: number;
  installmentValue?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string; // YYYY-MM-DD
  read: boolean;
  type: 'info' | 'warning' | 'danger' | 'success';
}

export interface Month {
  id: string; // YYYY-MM
}
