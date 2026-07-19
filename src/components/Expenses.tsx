import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { FileText, Plus, Filter, Edit, Trash2, X, Check, Clock } from 'lucide-react';

interface ExpensesProps {
  monthId: string;
  transactions: Transaction[];
  categories: Category[];
  onSaveTransaction: (trans: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export default function Expenses({
  monthId,
  transactions,
  categories,
  onSaveTransaction,
  onDeleteTransaction
}: ExpensesProps) {
  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Form fields
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

  // Set default date when monthId changes
  useEffect(() => {
    const today = new Date();
    const [year, month] = monthId.split('-');
    setDate(`${year}-${month}-${String(today.getDate()).padStart(2, '0')}`);
  }, [monthId]);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Filter general expenses (without a cardId)
  const generalExpenses = transactions.filter(
    t => t.monthId === monthId && t.type === 'expense' && !t.cardId
  );

  // Apply filter Status
  const filteredExpenses = generalExpenses.filter(t => {
    if (filterStatus === 'paid') return t.paymentStatus === 'Pago';
    if (filterStatus === 'unpaid') return t.paymentStatus === 'A Pagar';
    return true;
  });

  const totalExpenseSum = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Handle edit trigger
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
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await onDeleteTransaction(id);
      } catch (err) {
        alert('Erro ao excluir despesa.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim()) {
      setErrorMsg('Por favor, informe a descrição da conta.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Por favor, informe um valor válido.');
      return;
    }
    if (!date) {
      setErrorMsg('Por favor, selecione a data de vencimento.');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Por favor, selecione a categoria.');
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
        setErrorMsg('Total de parcelas inválido.');
        return;
      }
    }

    const payload: Omit<Transaction, 'id'> & { id?: string } = {
      monthId,
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
      setErrorMsg('Erro ao salvar despesa.');
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 animate-fade-in" id="expenses-view-container">
      {/* 4.2 Formulário de Lançamento */}
      <section className="lg:col-span-1">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <div className="h-8 w-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center">
              <FileText size={16} />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm font-display">
              {editingId ? 'Editar Despesa' : 'Lançar Boleto / Despesa'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Descrição / Conta</label>
              <input
                id="expense-description-input"
                type="text"
                placeholder="Ex: Energia Elétrica - Coelba"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
              />
            </div>

            {/* Valor */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Valor (R$)</label>
              <input
                id="expense-amount-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            {/* Vencimento */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Data de Vencimento</label>
              <input
                id="expense-date-input"
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
                id="expense-category-select"
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

            {/* Recorrência (À Vista ou Parcelado) */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Recorrência</label>
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

            {/* Installment bounds */}
            {frequency === 'installment' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/30 border border-white/5 rounded-xl animate-fade-in">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px]">Parcela Atual</label>
                  <input
                    id="expense-installment-current-input"
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
                    id="expense-installment-total-input"
                    type="number"
                    min="1"
                    value={installmentTotal}
                    onChange={(e) => setInstallmentTotal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/5 rounded-lg text-slate-100 font-mono text-center"
                  />
                </div>
              </div>
            )}

            {/* Propriedade (Próprio ou De Terceiros) */}
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

            {/* Status do Pagamento */}
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

            {/* Save Buttons */}
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
                id="expense-submit-btn"
                className="flex-2 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-xl transition shadow-lg shadow-red-950/20 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>{editingId ? 'Atualizar Despesa' : 'Salvar Conta'}</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 4.3 Lista de Contas */}
      <section className="lg:col-span-2 space-y-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col h-full justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pb-3.5 border-b border-white/5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Lista de Despesas / Contas ({monthId})
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  CONTAS RECORRENTES E BOLETOS DA COMPETÊNCIA (SEM CARTÃO)
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">TOTAL DO FILTRO</span>
                <span className="font-extrabold text-base text-red-400 font-mono">
                  {formatBRL(totalExpenseSum)}
                </span>
              </div>
            </div>

            {/* Filtros */}
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

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400">
                    <th className="pb-2.5 font-semibold">Descrição / Conta</th>
                    <th className="pb-2.5 font-semibold">Categoria</th>
                    <th className="pb-2.5 font-semibold">Propriedade</th>
                    <th className="pb-2.5 font-semibold">Vencimento</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right">Valor</th>
                    <th className="pb-2.5 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredExpenses.map((item) => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    return (
                      <tr key={item.id} className="hover:bg-white/2 transition">
                        <td className="py-3 text-slate-200">
                          {item.description}
                          {item.frequency === 'installment' && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] rounded font-semibold uppercase font-mono">
                              {item.installmentCurrent}/{item.installmentTotal}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400">{cat ? cat.name : 'Outros'}</td>
                        <td className="py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                            item.ownership === 'propria' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-purple-500/10 text-purple-400'
                          }`}>
                            {item.ownership === 'propria' ? 'Própria' : 'Terceiro'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 font-mono">{item.date}</td>
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
                        <td className="py-3 text-right font-extrabold text-red-400 font-mono">
                          {formatBRL(item.amount)}
                        </td>
                        <td className="py-3 text-center space-x-1 shrink-0">
                          <button
                            id={`edit-expense-${item.id}`}
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-white/5 transition inline-block"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            id={`delete-expense-${item.id}`}
                            onClick={() => handleDeleteClick(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition inline-block"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500 italic">
                        Nenhuma despesa de boleto listada para este mês e filtro.
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
  );
}
