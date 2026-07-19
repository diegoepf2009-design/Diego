import { useState, useEffect, useMemo } from 'react';
import { 
  openDB, 
  seedDatabase, 
  getAllFromStore, 
  putInStore, 
  deleteFromStore 
} from './db';
import { 
  Card, 
  Category, 
  Transaction, 
  SystemConfig, 
  AppNotification, 
  Month 
} from './types';

// Importing Tab Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import Incomes from './components/Incomes';
import Cards from './components/Cards';
import Expenses from './components/Expenses';
import Vehicle from './components/Vehicle';
import House from './components/House';
import Tithe from './components/Tithe';
import CalendarView from './components/CalendarView';
import Settings from './components/Settings';
import FinAIAssistant from './components/FinAIAssistant';

import * as XLSX from 'xlsx';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [monthId, setMonthId] = useState('2026-07');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Database core states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [months, setMonths] = useState<Month[]>([]);

  // 1. Initialize DB and Seed
  useEffect(() => {
    async function initDB() {
      try {
        await openDB();
        await seedDatabase();

        // Ensure default month exists in DB
        const savedMonths = await getAllFromStore<Month>('months');
        if (savedMonths.length === 0) {
          await putInStore('months', { id: '2026-07' });
        }

        setDbReady(true);
      } catch (err) {
        console.error('Error initializing indexedDB:', err);
      }
    }
    initDB();
  }, []);

  // 2. Load Core Data
  const reloadAllData = async () => {
    try {
      const allCards = await getAllFromStore<Card>('cards');
      const allCategories = await getAllFromStore<Category>('categories');
      const allTransactions = await getAllFromStore<Transaction>('transactions');
      const allConfigs = await getAllFromStore<SystemConfig>('system_config');
      const allNotifications = await getAllFromStore<AppNotification>('notifications');
      const allMonths = await getAllFromStore<Month>('months');

      setCards(allCards);
      setCategories(allCategories);
      setTransactions(allTransactions);
      setConfigs(allConfigs);
      setNotifications(allNotifications);
      setMonths(allMonths);

      // Perform background alerts audit
      await runNotificationsAudit(allTransactions, allCards, allNotifications);
    } catch (err) {
      console.error('Error reloading database:', err);
    }
  };

  useEffect(() => {
    if (dbReady) {
      reloadAllData();
    }
  }, [dbReady]);

  // 3. Automated Notification Rules (Rule checks matching deadlines)
  const runNotificationsAudit = async (
    currentTrans: Transaction[],
    currentCards: Card[],
    existingNotifications: AppNotification[]
  ) => {
    const currentLocalTimeStr = '2026-07-18'; // Set static reference today date
    const today = new Date(currentLocalTimeStr + 'T00:00:00');
    const cardMap = new Map(currentCards.map(c => [c.id, c]));

    const updatedNotifs = [...existingNotifications];
    let addedAny = false;

    for (const t of currentTrans) {
      if (t.type === 'expense' && t.paymentStatus === 'A Pagar') {
        // Resolve due date
        let dueDateStr = t.date;
        if (t.cardId) {
          const card = cardMap.get(t.cardId);
          if (card) {
            const [year, month] = t.monthId.split('-');
            dueDateStr = `${year}-${month}-${String(card.dueDay).padStart(2, '0')}`;
          }
        }

        // Calculate days difference
        const due = new Date(dueDateStr + 'T00:00:00');
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const formattedAmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount);

        // Vencidas (overdue < 0)
        if (diffDays < 0) {
          const notifId = `notif-overdue-${t.id}`;
          const exists = updatedNotifs.some(n => n.id === notifId);
          if (!exists) {
            const notif: AppNotification = {
              id: notifId,
              title: 'Despesa Vencida 🔴',
              message: `A despesa "${t.description}" de ${formattedAmt} venceu em ${dueDateStr}!`,
              date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              read: false,
              type: 'danger'
            };
            await putInStore('notifications', notif);
            updatedNotifs.unshift(notif);
            addedAny = true;
          }
        } 
        // Vencimento em até 3 dias
        else if (diffDays <= 3) {
          const notifId = `notif-3days-${t.id}`;
          const exists = updatedNotifs.some(n => n.id === notifId);
          if (!exists) {
            const notif: AppNotification = {
              id: notifId,
              title: 'Vencimento Crítico 🟠',
              message: `A conta "${t.description}" no valor de ${formattedAmt} vence em apenas ${diffDays} dias!`,
              date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              read: false,
              type: 'warning'
            };
            await putInStore('notifications', notif);
            updatedNotifs.unshift(notif);
            addedAny = true;
          }
        } 
        // Vencimento em até 7 dias
        else if (diffDays <= 7) {
          const notifId = `notif-7days-${t.id}`;
          const exists = updatedNotifs.some(n => n.id === notifId);
          if (!exists) {
            const notif: AppNotification = {
              id: notifId,
              title: 'Vencimento Próximo 🟡',
              message: `A conta "${t.description}" vence em ${diffDays} dias (${dueDateStr}).`,
              date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              read: false,
              type: 'info'
            };
            await putInStore('notifications', notif);
            updatedNotifs.unshift(notif);
            addedAny = true;
          }
        }
      }
    }

    if (addedAny) {
      const refreshedNotifs = await getAllFromStore<AppNotification>('notifications');
      setNotifications(refreshedNotifs);
    }
  };

  // 4. CRUD Transaction Core Callback
  const handleSaveTransaction = async (payload: Omit<Transaction, 'id'> & { id?: string }) => {
    // Determine random/unique ID if editing/new
    const updatedPayload: Transaction = {
      ...payload,
      id: payload.id || `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const previousTransObj = transactions.find(t => t.id === updatedPayload.id);

    await putInStore('transactions', updatedPayload);

    // Rule: Mark as paid triggers notification
    if (
      updatedPayload.type === 'expense' && 
      updatedPayload.paymentStatus === 'Pago' && 
      (!previousTransObj || previousTransObj.paymentStatus === 'A Pagar')
    ) {
      const notifId = `notif-paid-${updatedPayload.id}-${Date.now()}`;
      const notif: AppNotification = {
        id: notifId,
        title: 'Pagamento Confirmado 🟢',
        message: `A conta "${updatedPayload.description}" de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(updatedPayload.amount)} foi paga com sucesso!`,
        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'success'
      };
      await putInStore('notifications', notif);
    }

    await reloadAllData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteFromStore('transactions', id);
    await reloadAllData();
  };

  const handleTogglePaymentStatus = async (transId: string) => {
    const target = transactions.find(t => t.id === transId);
    if (target) {
      const updated: Transaction = {
        ...target,
        paymentStatus: target.paymentStatus === 'Pago' ? 'A Pagar' : 'Pago'
      };
      await handleSaveTransaction(updated);
    }
  };

  // 5. Month Cloning routine (Separated month ID allocations)
  const handleCloneMonth = async () => {
    const [year, month] = monthId.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const nextMonthId = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

    const currentTrans = transactions.filter(t => t.monthId === monthId);

    let clonedCount = 0;
    for (const t of currentTrans) {
      // If completed installment skip cloning
      let instCurrent = t.installmentCurrent;
      if (t.frequency === 'installment' && t.installmentCurrent !== undefined && t.installmentTotal !== undefined) {
        if (t.installmentCurrent >= t.installmentTotal) {
          continue;
        }
        instCurrent = t.installmentCurrent + 1;
      }

      const [tY, tM, tD] = t.date.split('-');
      const newDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${tD || '10'}`;

      const clonedTrans: Transaction = {
        ...t,
        id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        monthId: nextMonthId,
        date: newDateStr,
        paymentStatus: t.type === 'income' ? 'Pago' : 'A Pagar', // reset expenses to pay
        installmentCurrent: instCurrent
      };

      await putInStore('transactions', clonedTrans);
      clonedCount++;
    }

    // Add nextMonth to months table if missing
    const monthExists = months.some(m => m.id === nextMonthId);
    if (!monthExists) {
      await putInStore('months', { id: nextMonthId });
    }

    await reloadAllData();
    setMonthId(nextMonthId);
    alert(`Competência clonada! ${clonedCount} transações migradas para ${nextMonthId}.`);
  };

  // 6. Settings Callbacks (Cards and Categories persistence)
  const handleSaveCard = async (payload: Omit<Card, 'id' | 'balance'> & { id?: string }) => {
    const cardId = payload.id || `card-${Date.now()}`;
    const targetCard: Card = {
      ...payload,
      id: cardId,
      balance: 0
    };
    await putInStore('cards', targetCard);
    await reloadAllData();
  };

  const handleDeleteCard = async (id: string) => {
    await deleteFromStore('cards', id);
    await reloadAllData();
  };

  const handleSaveCategory = async (payload: Category) => {
    await putInStore('categories', payload);
    await reloadAllData();
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteFromStore('categories', id);
    await reloadAllData();
  };

  const handleSaveSystemConfig = async (payload: SystemConfig) => {
    await putInStore('system_config', payload);
    await reloadAllData();
  };

  // 7. Notification center read / clear triggers
  const handleMarkNotificationRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (target) {
      await putInStore('notifications', { ...target, read: true });
      await reloadAllData();
    }
  };

  const handleClearNotifications = async () => {
    for (const notif of notifications) {
      if (!notif.read) {
        await putInStore('notifications', { ...notif, read: true });
      }
    }
    await reloadAllData();
  };

  // 8. EXPORTS (SheetJS and html2pdf CDNs)
  const handleExportExcel = () => {
    const currentTrans = transactions.filter(t => t.monthId === monthId);
    const exportData = currentTrans.map(t => ({
      'Descrição': t.description,
      'Valor (R$)': t.amount,
      'Tipo': t.type === 'income' ? 'Receita' : 'Despesa',
      'Data de Lançamento': t.date,
      'Status de Pagamento': t.paymentStatus,
      'Competência': t.monthId
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Mensal');
    XLSX.writeFile(workbook, `Planilha_${monthId}.xlsx`);
  };

  const handleExportPDF = () => {
    const currentTrans = transactions.filter(t => t.monthId === monthId);
    const totalIn = currentTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalOut = currentTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const bal = totalIn - totalOut;

    const element = document.createElement('div');
    element.style.padding = '24px';
    element.style.fontFamily = 'sans-serif';
    element.style.color = '#0f172a';
    element.style.backgroundColor = '#ffffff';

    element.innerHTML = `
      <div style="border-bottom: 2px solid #06b6d4; padding-bottom: 12px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #0f172a; font-size: 24px;">Relatório de Competência - FinAI Premium</h1>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 11px;">Mês de Referência: ${monthId} | Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 24px; padding: 10px 0;">
        <div style="border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background-color: #f8fafc;">
          <span style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Receitas</span>
          <h3 style="margin: 4px 0 0 0; color: #10b981; font-size: 15px;">R$ ${totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div style="border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background-color: #f8fafc;">
          <span style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">Total Despesas</span>
          <h3 style="margin: 4px 0 0 0; color: #ef4444; font-size: 15px;">R$ ${totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div style="border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background-color: #f8fafc;">
          <span style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">Saldo de Caixa</span>
          <h3 style="margin: 4px 0 0 0; color: ${bal >= 0 ? '#10b981' : '#ef4444'}; font-size: 15px;">R$ ${bal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      <h2 style="font-size: 13px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; color: #0f172a; margin-top: 20px;">Lista de Lançamentos</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left;">
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1;">Descrição</th>
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1;">Data</th>
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1;">Tipo</th>
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1;">Status</th>
            <th style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${currentTrans.map(t => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px;">${t.description}</td>
              <td style="padding: 8px;">${t.date}</td>
              <td style="padding: 8px; color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">${t.type === 'income' ? 'Receita' : 'Despesa'}</td>
              <td style="padding: 8px;">${t.paymentStatus}</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const opt = {
      margin:       10,
      filename:     `Relatorio_${monthId}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().from(element).set(opt).save();
    } else {
      alert('Erro ao carregar renderizador de PDF. Certifique-se de que a conexão CDN de html2pdf esteja ativa.');
    }
  };

  // Render content according to active Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            monthId={monthId}
            transactions={transactions}
            cards={cards}
            categories={categories}
            onNavigateToTab={setActiveTab}
            onTogglePaymentStatus={handleTogglePaymentStatus}
          />
        );
      case 'incomes':
        return (
          <Incomes 
            monthId={monthId}
            transactions={transactions}
            categories={categories}
            onSaveTransaction={handleSaveTransaction}
          />
        );
      case 'cards':
        return (
          <Cards 
            monthId={monthId}
            transactions={transactions}
            cards={cards}
            categories={categories}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'expenses':
        return (
          <Expenses 
            monthId={monthId}
            transactions={transactions}
            categories={categories}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'car':
        return (
          <Vehicle 
            configs={configs}
            onSaveConfig={handleSaveSystemConfig}
          />
        );
      case 'house':
        return (
          <House 
            configs={configs}
            onSaveConfig={handleSaveSystemConfig}
          />
        );
      case 'tithe':
        return (
          <Tithe 
            monthId={monthId}
            transactions={transactions}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            monthId={monthId}
            transactions={transactions}
            cards={cards}
            categories={categories}
          />
        );
      case 'settings':
        return (
          <Settings 
            cards={cards}
            categories={categories}
            onSaveCard={handleSaveCard}
            onDeleteCard={handleDeleteCard}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      default:
        return null;
    }
  };

  if (!dbReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020617] text-slate-100 flex-col gap-4">
        <svg className="animate-spin h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-xs font-mono tracking-widest text-slate-400 uppercase animate-pulse">
          Inicializando Banco de Dados FinAI...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500/20 antialiased" id="finai-root">
      
      {/* Side Navigation (Left column on desktop, floating tab-bar on mobile) */}
      <Sidebar currentTab={activeTab} onChangeTab={setActiveTab} />

      {/* Main app body wrapper */}
      <div className="min-[900px]:pl-64 flex flex-col min-h-screen relative">
        
        {/* Top bar month actions */}
        <Topbar 
          monthId={monthId}
          onChangeMonth={setMonthId}
          onCloneMonth={handleCloneMonth}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onClearNotifications={handleClearNotifications}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />

        {/* Dynamic page content container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-24 min-[900px]:pb-8">
          {renderTabContent()}
        </main>

        {/* AI Assistant floaters */}
        <FinAIAssistant 
          currentTab={activeTab}
          transactions={transactions}
          cards={cards}
          configs={configs}
          monthId={monthId}
        />

      </div>
    </div>
  );
}
