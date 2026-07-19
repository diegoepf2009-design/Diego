import { Card, Category, Transaction, SystemConfig, AppNotification, Month } from './types';

const DB_NAME = 'FinAI_Premium_DB';
const DB_VERSION = 2;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains('months')) {
        db.createObjectStore('months', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cards')) {
        db.createObjectStore('cards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const transStore = db.createObjectStore('transactions', { keyPath: 'id' });
        transStore.createIndex('monthId', 'monthId', { unique: false });
      }
      if (!db.objectStoreNames.contains('system_config')) {
        db.createObjectStore('system_config', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
  });
}

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putInStore<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function seedDatabase(): Promise<void> {
  const cards = await getAllFromStore<Card>('cards');
  if (cards.length === 0) {
    const initialCards: Card[] = [
      { id: 'card-nubank-diego', name: 'Nubank Diego', brand: 'Nubank', color: '#8A05BE', balance: 0, dueDay: 10 },
      { id: 'card-nubank-rithele', name: 'Nubank Rithele', brand: 'Nubank', color: '#a855f7', balance: 0, dueDay: 10 },
      { id: 'card-bv-diego', name: 'BV Diego', brand: 'BV', color: '#0284c7', balance: 0, dueDay: 15 },
      { id: 'card-inter-diego', name: 'Inter Diego', brand: 'Inter', color: '#f97316', balance: 0, dueDay: 20 },
    ];
    for (const card of initialCards) {
      await putInStore('cards', card);
    }
  }

  const categories = await getAllFromStore<Category>('categories');
  if (categories.length === 0) {
    const initialCategories: Category[] = [
      { id: 'cat-supermercado', name: '🛒 Supermercado', type: 'expense' },
      { id: 'cat-moradia', name: '🏠 Moradia', type: 'expense' },
      { id: 'cat-carro-combustivel', name: '🚗 Carro e Combustível', type: 'expense' },
      { id: 'cat-financiamento-carro', name: '🚘 Financiamento carro', type: 'expense' },
      { id: 'cat-financiamento-imobiliario', name: '🏠 Financiamento Imobiliário', type: 'expense' },
      { id: 'cat-alimentacao', name: '🍔 Alimentação', type: 'expense' },
      { id: 'cat-saude', name: '💊 Saúde', type: 'expense' },
      { id: 'cat-outros', name: '📦 Outros', type: 'expense' },
      { id: 'cat-dizimo', name: '🙏 Dízimo e Ofertas', type: 'expense', isSystem: true },
      { id: 'cat-salario', name: '💰 Salário', type: 'income' },
    ];
    for (const cat of initialCategories) {
      await putInStore('categories', cat);
    }
  }

  const systemConfig = await getAllFromStore<SystemConfig>('system_config');
  if (systemConfig.length === 0) {
    const initialConfigs: SystemConfig[] = [
      { id: 'car', model: 'HB20 S 2023', quitTodayValue: 15600, totalInstallments: 48, paidInstallments: 20, installmentValue: 1200 },
      { id: 'house', model: 'Apartamento 2 quartos', quitTodayValue: 85000, totalInstallments: 360, paidInstallments: 120, installmentValue: 1500 }
    ];
    for (const conf of initialConfigs) {
      await putInStore('system_config', conf);
    }
  }
}
