import { useMemo } from 'react';
import { Transaction, Card, Category } from '../types';
import { CalendarDays, CheckCircle2, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

interface CalendarViewProps {
  monthId: string;
  transactions: Transaction[];
  cards: Card[];
  categories: Category[];
}

export default function CalendarView({
  monthId,
  transactions,
  cards,
  categories
}: CalendarViewProps) {
  const currentLocalTimeStr = '2026-07-18'; // Simulated current date

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);

  // All current month transactions, processed for due dates
  const processedEvents = useMemo(() => {
    const monthTrans = transactions.filter(t => t.monthId === monthId);

    return monthTrans.map(item => {
      // Rule 8.1: Determine Due Date
      let dueDateStr = item.date;

      if (item.type === 'expense' && item.cardId) {
        const card = cardMap.get(item.cardId);
        if (card) {
          // If transaction has a credit card, use the card's dueDay for the due date
          const [year, month] = monthId.split('-');
          dueDateStr = `${year}-${month}-${String(card.dueDay).padStart(2, '0')}`;
        }
      }

      // Calculate days difference relative to 2026-07-18
      let diffDays = 999;
      try {
        const due = new Date(dueDateStr + 'T00:00:00');
        const current = new Date(currentLocalTimeStr + 'T00:00:00');
        const diffTime = due.getTime() - current.getTime();
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } catch (e) {
        // Fallback
      }

      // Determine Visual Style rules
      let statusColor = 'border-slate-500';
      let bgColor = 'bg-slate-900/40';
      let statusText = 'A Pagar';

      if (item.type === 'income') {
        statusColor = 'border-emerald-500';
        statusText = 'Recebido';
      } else if (item.paymentStatus === 'Pago') {
        statusColor = 'border-emerald-500'; // 🟢 Pago
        statusText = 'Pago';
      } else {
        // Red - Overdue
        if (diffDays < 0) {
          statusColor = 'border-red-500'; // 🔴 Vencido
          bgColor = 'bg-red-950/20';
          statusText = `Vencido há ${Math.abs(diffDays)} dia(s)`;
        } 
        // Orange - Due in <= 3 days
        else if (diffDays <= 3) {
          statusColor = 'border-orange-500'; // 🟠 Vence em até 3 dias
          bgColor = 'bg-orange-950/10';
          statusText = `Vence em ${diffDays} dia(s)`;
        } 
        // Yellow - Due in <= 7 days
        else if (diffDays <= 7) {
          statusColor = 'border-amber-500'; // 🟡 Vence em até 7 dias
          statusText = `Vence em ${diffDays} dia(s)`;
        } 
        // Blue - Installments
        else if (item.frequency === 'installment') {
          statusColor = 'border-blue-500'; // 🔵 Parcelado
          statusText = 'Parcelado';
        } else {
          statusColor = 'border-cyan-500';
          statusText = 'A Pagar';
        }
      }

      return {
        ...item,
        resolvedDueDate: dueDateStr,
        diffDays,
        statusColor,
        bgColor,
        statusText
      };
    }).sort((a, b) => a.resolvedDueDate.localeCompare(b.resolvedDueDate));
  }, [transactions, monthId, cardMap]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="calendar-view-container">
      {/* Legend guide */}
      <div className="glass-panel rounded-2xl p-4.5 border border-white/5 shadow-md space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <HelpCircle size={14} className="text-slate-400" />
          <span>Legenda de Cores de Vencimento</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[10px] font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/10">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Pago / Entrada</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/10">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span>Vence em até 7 dias</span>
          </div>
          <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 p-2 rounded-xl border border-orange-500/10">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            <span>Vence em até 3 dias</span>
          </div>
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-2 rounded-xl border border-red-500/10">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span>Vencido</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 p-2 rounded-xl border border-blue-500/10">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            <span>Parcelado</span>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <h2 className="text-sm font-bold font-display text-slate-100 flex items-center gap-1.5">
            <CalendarDays size={16} className="text-cyan-400" />
            <span>Fluxo Cronológico de Vencimentos ({monthId})</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Simulação de hoje: {currentLocalTimeStr}</span>
        </div>

        <div className="space-y-2.5">
          {processedEvents.map(event => {
            const cat = categoryMap.get(event.categoryId);
            const card = event.cardId ? cardMap.get(event.cardId) : null;

            return (
              <div 
                key={event.id} 
                className={`p-3.5 ${event.bgColor} rounded-xl border-l-4 ${event.statusColor} border-t border-r border-b border-white/5 hover:border-white/10 transition flex flex-col md:flex-row md:items-center md:justify-between gap-3`}
              >
                {/* Left Block */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950/60 flex items-center justify-center text-sm border border-white/5 shadow-inner">
                    {cat ? cat.name.split(' ')[0] : '📝'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-xs">{event.description}</span>
                      {card && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: card.color }}>
                          {card.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>Categoria: {cat ? cat.name : 'Outros'}</span>
                      <span>•</span>
                      <span className="font-mono">Data: {event.resolvedDueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Right Block */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-2.5 md:pt-0 border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {event.statusText}
                  </span>
                  
                  <span className={`font-extrabold text-sm font-mono ${event.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {event.type === 'income' ? '+' : '-'}{formatBRL(event.amount)}
                  </span>
                </div>
              </div>
            );
          })}

          {processedEvents.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 italic text-xs">
              <CalendarDays size={32} className="text-slate-600 mb-2" />
              <span>Nenhum lançamento ou vencimento agendado para esta competência.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
