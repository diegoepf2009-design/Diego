import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { TrendingUp, Plus, Calendar, Edit, X } from 'lucide-react';

interface IncomesProps {
  monthId: string;
  transactions: Transaction[];
  categories: Category[];
  onSaveTransaction: (trans: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
}

export default function Incomes({
  monthId,
  transactions,
  categories,
  onSaveTransaction
}: IncomesProps) {
  // Local form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'installment'>('once');
  const [ownership, setOwnership] = useState<'propria' | 'terceiro'>('propria');
  const [errorMsg, setErrorMsg] = useState('');

  // Income categories filter
  const incomeCategories = categories.filter(c => c.type === 'income');

  // Filter current month incomes
  const currentIncomes = transactions.filter(
    t => t.monthId === monthId && t.type === 'income'
  );

  // Set default date when monthId changes
  useEffect(() => {
    // Set first day of current selected month/year
    const today = new Date();
    const [year, month] = monthId.split('-');
    const defaultDate = `${year}-${month}-${String(today.getDate()).padStart(2, '0')}`;
    setDate(defaultDate);
  }, [monthId]);

  // Load transaction into form for editing
  const handleEditClick = (item: Transaction) => {
    setEditingId(item.id);
    setDescription(item.description);
    setAmount(item.amount.toString());
    setDate(item.date);
    setCategoryId(item.categoryId);
    setFrequency(item.frequency);
    setOwnership(item.ownership);
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
    setCategoryId(incomeCategories[0]?.id || '');
    setFrequency('once');
    setOwnership('propria');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim()) {
      setErrorMsg('Por favor, informe a descrição/origem.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Por favor, insira um valor válido maior que zero.');
      return;
    }
    if (!date) {
      setErrorMsg('Por favor, selecione a data do lançamento.');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Por favor, selecione uma categoria.');
      return;
    }

    // Prepare transaction payload
    const payload: Omit<Transaction, 'id'> & { id?: string } = {
      monthId,
      type: 'income',
      description: description.trim(),
      amount: Number(parsedAmount.toFixed(2)),
      date,
      categoryId,
      ownership,
      frequency,
      paymentStatus: 'Pago', // Incomes are always "pago"
    };

    if (editingId) {
      payload.id = editingId;
    }

    try {
      await onSaveTransaction(payload);
      // Reset form
      handleCancelEdit();
    } catch (err) {
      setErrorMsg('Erro ao salvar receita.');
    }
  };

  // Format currency
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 animate-fade-in" id="incomes-view">
      {/* Form Section */}
      <section className="lg:col-span-1">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm font-display">
              {editingId ? 'Editar Receita' : 'Lançar Receita'}
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
              <label className="text-slate-400 font-medium">Descrição / Origem</label>
              <input
                id="income-description-input"
                type="text"
                placeholder="Ex: Salário Mensal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
              />
            </div>

            {/* Valor */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Valor (R$)</label>
              <input
                id="income-amount-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            {/* Data */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Data do Lançamento</label>
              <input
                id="income-date-input"
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
                id="income-category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#060c1f] border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
              >
                <option value="">Selecione...</option>
                {incomeCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Forma (À vista ou parcelada) */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Forma</label>
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
                  Parcelada
                </button>
              </div>
            </div>

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
                  Própria
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

            {/* Actions */}
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
                id="income-submit-btn"
                className="flex-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>{editingId ? 'Atualizar Receita' : 'Adicionar Entrada'}</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* List Section */}
      <section className="lg:col-span-2 space-y-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col h-full justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Lista de Receitas ({monthId})
              </h3>
              <div className="text-xs text-slate-400">
                Total do Mês:{' '}
                <span className="font-extrabold text-emerald-400">
                  {formatBRL(currentIncomes.reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400">
                    <th className="pb-2.5 font-semibold">Descrição/Origem</th>
                    <th className="pb-2.5 font-semibold">Categoria</th>
                    <th className="pb-2.5 font-semibold">Propriedade</th>
                    <th className="pb-2.5 font-semibold">Data</th>
                    <th className="pb-2.5 font-semibold text-right">Valor</th>
                    <th className="pb-2.5 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {currentIncomes.map((item) => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    return (
                      <tr key={item.id} className="hover:bg-white/2 transition group">
                        <td className="py-3 text-slate-200">
                          {item.description}
                          {item.frequency === 'installment' && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] rounded font-semibold uppercase">
                              Parcelada
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400">{cat ? cat.name : 'Sem Categoria'}</td>
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
                        <td className="py-3 text-right font-extrabold text-emerald-400 font-mono">
                          {formatBRL(item.amount)}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            id={`edit-income-${item.id}`}
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-white/5 transition"
                          >
                            <Edit size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {currentIncomes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 italic">
                        Nenhuma receita lançada para este mês.
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
