import React, { useState, useEffect } from 'react';
import { Transaction, Card, Category } from '../types';
import { CreditCard, Plus, Filter, Edit, Trash2, X, Check, Clock } from 'lucide-react';

interface CardsProps {
  monthId: string;
  transactions: Transaction[];
  cards: Card[];
  categories: Category[];
  onSaveTransaction: (trans: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export default function Cards({
  monthId,
  transactions,
  cards,
  categories,
  onSaveTransaction,
  onDeleteTransaction
}: CardsProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'installment'>('once');
  const [installmentCurrent, setInstallmentCurrent] = useState('1');
  const [installmentTotal, setInstallmentTotal] = useState('2');
  const [ownership, setOwnership] = useState<'propria' | 'terceiro'>('propria');
  const [paymentStatus, setPaymentStatus] = useState<'Pago' | 'A Pagar'>('A Pagar');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-select first card if none selected
  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // Set default date when monthId changes
  useEffect(() => {
    const today = new Date();
    const [year, month] = monthId.split('-');
    setDate(`${year}-${month}-${String(today.getDate()).padStart(2, '0')}`);
  }, [monthId]);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Get current transactions for the selected card
  const cardTransactions = transactions.filter(
    t => t.monthId === monthId && t.cardId === selectedCardId && t.type === 'expense'
  );

  // Apply filters
  const filteredTransactions = cardTransactions.filter(t => {
    if (filterStatus === 'paid') return t.paymentStatus === 'Pago';
    if (filterStatus === 'unpaid') return t.paymentStatus === 'A Pagar';
    return true;
  });

  // Consolidate total sum
  const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Handle Edit click
  const handleEditClick = (item: Transaction) => {
    setEditingId(item.id);
    setDescription(item.description);
    setAmount(item.amount.toString());
    setDate(item.date);
    setCategoryId(item.categoryId);
    setFrequency(item.frequency);
    if (item.frequency === 'installment') {
      setInstallmentCurrent(String(item.installmentCurrent || '1'));
      setInstallmentTotal(String(item.installmentTotal || '12'));
    }
    setOwnership(item.ownership);
    setPaymentStatus(item.paymentStatus);
    setErrorMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    // set default date
    const today = new Date();
    const [year, month] = monthId.split('-');
    setDate(`${year}-${month}-${String(today.getDate()).padStart(2, '0')}`);
    setCategoryId(expenseCategories[0]?.id || '');
    setFrequency('once');
    setInstallmentCurrent('1');
    setInstallmentTotal('2');
    setOwnership('propria');
    setPaymentStatus('A Pagar');
    setErrorMsg('');
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await onDeleteTransaction(id);
      } catch (err) {
        alert('Erro ao excluir transação.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCardId) {
      setErrorMsg('Por favor, selecione um cartão de crédito.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Por favor, informe o estabelecimento.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Por favor, informe um valor de compra válido.');
      return;
    }
    if (!date) {
      setErrorMsg('Por favor, informe a data da compra.');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Por favor, selecione a categoria de despesa.');
      return;
    }

    let current = undefined;
    let total = undefined;

    if (frequency === 'installment') {
      current = parseInt(installmentCurrent);
      total = parseInt(installmentTotal);
      if (isNaN(current) || current < 1) {
        setErrorMsg('Parcela atual inválida.');
        return;
      }
      if (isNaN(total) || total < current) {
        setErrorMsg('Total de parcelas deve ser maior ou igual à parcela atual.');
        return;
      }
    }

    const payload: Omit<Transaction, 'id'> & { id?: string } = {
      monthId,
      cardId: selectedCardId,
      type: 'expense',
      description: description.trim(),
      amount: Number(parsedAmount.toFixed(2)),
      date,
      categoryId,
      ownership,
      frequency,
      installmentCurrent: current,
      installmentTotal: total,
      paymentStatus
    };

    if (editingId) {
      payload.id = editingId;
    }

    try {
      await onSaveTransaction(payload);
      handleCancelEdit();
    } catch (err) {
      setErrorMsg('Erro ao salvar despesa no cartão.');
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const selectedCardObj = cards.find(c => c.id === selectedCardId);

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="cards-view-container">
      {/* 3.1 Seleção de Cartão (Carrossel Horizontal) */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Selecione o Cartão para Lançar/Filtrar
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-thin">
          {cards.map(card => {
            const isSelected = card.id === selectedCardId;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`w-52 h-28 shrink-0 rounded-2xl p-3.5 flex flex-col justify-between snap-start relative overflow-hidden shadow-md cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'scale-102 border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]' 
                    : 'border border-white/5 opacity-60 hover:opacity-90'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${card.color}dd 0%, #020617dd 100%)`
                }}
              >
                <div>
                  <h3 className="text-[10px] uppercase tracking-wider font-semibold text-white/90">
                    {card.name}
                  </h3>
                  <p className="text-[8px] text-white/50 font-mono mt-0.5">Vence: Dia {card.dueDay}</p>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-[8px] text-white/55 font-mono uppercase">BANDEIRA: {card.brand}</span>
                  <div className="h-5 w-7 bg-white/10 rounded-md flex items-center justify-center text-[8px] text-white font-bold tracking-widest font-mono">
                    {card.brand.substring(0, 3).toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}

          {cards.length === 0 && (
            <div className="w-full py-8 text-center rounded-2xl glass-panel text-slate-400 border border-white/5 text-xs italic">
              Nenhum cartão cadastrado. Vá até Configurações para gerenciar cartões.
            </div>
          )}
        </div>
      </section>

      {/* Main layout splitting Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3.3 Formulário de Lançamento de Gastos */}
        <section className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm font-display">
                {editingId ? 'Editar Compra' : 'Gravar no Cartão'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Selected card header indicator */}
              {selectedCardObj && (
                <div className="p-2.5 rounded-xl flex items-center justify-between border text-[11px] font-semibold" style={{ backgroundColor: `${selectedCardObj.color}15`, borderColor: `${selectedCardObj.color}35` }}>
                  <span className="text-slate-300">Cartão Ativo:</span>
                  <span className="text-white" style={{ color: selectedCardObj.color }}>{selectedCardObj.name}</span>
                </div>
              )}

              {/* Estabelecimento */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Estabelecimento / Descrição</label>
                <input
                  id="card-description-input"
                  type="text"
                  placeholder="Ex: Supermercado Pão de Açúcar"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
                />
              </div>

              {/* Valor */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Valor da Compra (R$)</label>
                <input
                  id="card-amount-input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
                />
              </div>

              {/* Data da Compra */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Data da Compra</label>
                <input
                  id="card-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Categoria</label>
                <select
                  id="card-category-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#060c1f] border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
                >
                  <option value="">Selecione...</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Forma (À Vista ou Parcelado) */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('once')}
                    className={`py-2 px-3 rounded-xl font-semibold transition border ${
                      frequency === 'once' 
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                        : 'bg-slate-900/40 border-white/5 text-slate-400'
                    }`}
                  >
                    À Vista
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('installment')}
                    className={`py-2 px-3 rounded-xl font-semibold transition border ${
                      frequency === 'installment' 
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                        : 'bg-slate-900/40 border-white/5 text-slate-400'
                    }`}
                  >
                    Parcelado
                  </button>
                </div>
              </div>

              {/* Installment parameters (Visible only if Parcelado) */}
              {frequency === 'installment' && (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/30 border border-white/5 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px]">Parcela Atual</label>
                    <input
                      id="card-installment-current-input"
                      type="number"
                      min="1"
                      value={installmentCurrent}
                      onChange={(e) => setInstallmentCurrent(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 rounded-lg text-slate-100 font-mono text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px]">Total Parcelas</label>
                    <input
                      id="card-installment-total-input"
                      type="number"
                      min="1"
                      value={installmentTotal}
                      onChange={(e) => setInstallmentTotal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 rounded-lg text-slate-100 font-mono text-center"
                    />
                  </div>
                </div>
              )}

              {/* Propriedade (Própria ou De Terceiros) */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Propriedade</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOwnership('propria')}
                    className={`py-2 px-3 rounded-xl font-semibold transition border ${
                      ownership === 'propria' 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : 'bg-slate-900/40 border-white/5 text-slate-400'
                    }`}
                  >
                    Próprio
                  </button>
                  <button
                    type="button"
                    onClick={() => setOwnership('terceiro')}
                    className={`py-2 px-3 rounded-xl font-semibold transition border ${
                      ownership === 'terceiro' 
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400' 
                        : 'bg-slate-900/40 border-white/5 text-slate-400'
                    }`}
                  >
                    De Terceiros
                  </button>
                </div>
              </div>

              {/* Status do pagamento */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Status do Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('A Pagar')}
                    className={`py-2 px-3 rounded-xl font-semibold transition border ${
                      paymentStatus === 'A Pagar' 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                        : 'bg-slate-900/40 border-white/5 text-slate-400'
                    }`}
                  >
                    A Pagar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Pago')}
                    className={`py-2 px-3 rounded-xl font-semibold transition border ${
                      paymentStatus === 'Pago' 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : 'bg-slate-900/40 border-white/5 text-slate-400'
                    }`}
                  >
                    Pago
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-3 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <X size={14} />
                    <span>Cancelar</span>
                  </button>
                )}
                <button
                  type="submit"
                  id="card-submit-btn"
                  className="flex-2 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-950/20 flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{editingId ? 'Atualizar Compra' : 'Gravar no Cartão'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* 3.4 Extrato do Cartão (Statement logs) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col h-full justify-between">
            <div className="space-y-4">
              {/* Header with statement stats and status filters */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pb-3.5 border-b border-white/5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Extrato do Cartão selecionado ({monthId})
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">
                    Cartão: {selectedCardObj?.name || 'Selecione...'}
                  </p>
                </div>
                
                {/* Total Consolidado */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">TOTAL CONSOLIDADO</span>
                  <span className="font-extrabold text-base text-cyan-400 font-mono">
                    {formatBRL(totalSpent)}
                  </span>
                </div>
              </div>

              {/* 3.2 Filtros de status */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <Filter size={11} /> Filtrar:
                </span>
                <div className="flex bg-slate-900/60 border border-white/5 p-0.5 rounded-lg text-[10px] font-semibold">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1 rounded-md transition ${
                      filterStatus === 'all' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilterStatus('paid')}
                    className={`px-3 py-1 rounded-md transition ${
                      filterStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    Pagas
                  </button>
                  <button
                    onClick={() => setFilterStatus('unpaid')}
                    className={`px-3 py-1 rounded-md transition ${
                      filterStatus === 'unpaid' ? 'bg-amber-500/10 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    A Pagar
                  </button>
                </div>
              </div>

              {/* Extract Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400">
                      <th className="pb-2.5 font-semibold">Estabelecimento</th>
                      <th className="pb-2.5 font-semibold">Categoria</th>
                      <th className="pb-2.5 font-semibold">Propriedade</th>
                      <th className="pb-2.5 font-semibold">Data</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                      <th className="pb-2.5 font-semibold text-right">Valor</th>
                      <th className="pb-2.5 text-center font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredTransactions.map(item => {
                      const cat = categories.find(c => c.id === item.categoryId);
                      return (
                        <tr key={item.id} className="hover:bg-white/2 transition">
                          {/* Descrição */}
                          <td className="py-3 text-slate-200">
                            <span>{item.description}</span>
                            {item.frequency === 'installment' && (
                              <span className="ml-1.5 px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] rounded font-semibold uppercase font-mono">
                                Parcela {item.installmentCurrent}/{item.installmentTotal}
                              </span>
                            )}
                          </td>
                          {/* Categoria */}
                          <td className="py-3 text-slate-400">{cat ? cat.name : 'Sem Categoria'}</td>
                          {/* Ownership */}
                          <td className="py-3 text-slate-400 capitalize">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                              item.ownership === 'propria' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-purple-500/10 text-purple-400'
                            }`}>
                              {item.ownership === 'propria' ? 'Próprio' : 'Terceiro'}
                            </span>
                          </td>
                          {/* Data */}
                          <td className="py-3 text-slate-500 font-mono">{item.date}</td>
                          {/* Status */}
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1 w-fit uppercase ${
                              item.paymentStatus === 'Pago' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {item.paymentStatus === 'Pago' ? (
                                <>
                                  <Check size={8} /> Pago
                                </>
                              ) : (
                                <>
                                  <Clock size={8} /> A Pagar
                                </>
                              )}
                            </span>
                          </td>
                          {/* Valor */}
                          <td className="py-3 text-right font-extrabold text-red-400 font-mono">
                            {formatBRL(item.amount)}
                          </td>
                          {/* Actions */}
                          <td className="py-3 text-center space-x-1 shrink-0">
                            <button
                              id={`edit-card-expense-${item.id}`}
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-white/5 transition inline-block"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              id={`delete-card-expense-${item.id}`}
                              onClick={() => handleDeleteClick(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition inline-block"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-500 italic">
                          Nenhuma compra registrada para este cartão e filtro selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
