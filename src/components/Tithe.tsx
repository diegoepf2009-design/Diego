import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { Coins, Heart, Calendar, Plus, Trash2 } from 'lucide-react';

interface TitheProps {
  monthId: string;
  transactions: Transaction[];
  onSaveTransaction: (trans: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export default function Tithe({
  monthId,
  transactions,
  onSaveTransaction,
  onDeleteTransaction
}: TitheProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Set default date when monthId changes
  useEffect(() => {
    const today = new Date();
    const [year, month] = monthId.split('-');
    setDate(`${year}-${month}-${String(today.getDate()).padStart(2, '0')}`);
  }, [monthId]);

  // Filter tithes & offerings (categoryId = 'cat-dizimo' and current month)
  const titheTransactions = transactions.filter(
    t => t.monthId === monthId && t.categoryId === 'cat-dizimo' && t.type === 'expense'
  );

  const totalConsecrated = titheTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Por favor, informe um valor de contribuição válido.');
      return;
    }
    if (!date) {
      setErrorMsg('Por favor, selecione a data da contribuição.');
      return;
    }

    // Save as system transaction in the core transactions DB
    const payload: Omit<Transaction, 'id'> = {
      monthId,
      type: 'expense',
      description: 'Oferta Individual',
      amount: Number(parsedAmount.toFixed(2)),
      date,
      categoryId: 'cat-dizimo',
      ownership: 'propria',
      frequency: 'once',
      paymentStatus: 'Pago' // Offerings are always Paid
    };

    try {
      await onSaveTransaction(payload);
      setSuccessMsg('Contribuição registrada com sucesso!');
      setAmount('');
      const today = new Date();
      const [year, month] = monthId.split('-');
      setDate(`${year}-${month}-${String(today.getDate()).padStart(2, '0')}`);
    } catch (err) {
      setErrorMsg('Erro ao salvar contribuição.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir este lançamento de dízimo/oferta?')) {
      try {
        await onDeleteTransaction(id);
      } catch (err) {
        alert('Erro ao excluir.');
      }
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 animate-fade-in" id="tithe-view">
      {/* 7.1 Formulário de Lançamento */}
      <section className="lg:col-span-1">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Heart size={16} />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm font-display">Registrar Oferta / Dízimo</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-semibold">
                {successMsg}
              </div>
            )}

            {/* Valor */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Valor da Contribuição (R$)</label>
              <input
                id="tithe-amount-input"
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
              <label className="text-slate-400 font-medium">Data</label>
              <input
                id="tithe-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            <button
              type="submit"
              id="tithe-submit-btn"
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>Registrar Oferta</span>
            </button>
          </form>
        </div>
      </section>

      {/* 7.2 Lista de Ofertas */}
      <section className="lg:col-span-2 space-y-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col h-full justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Lista de Ofertas Consagradas ({monthId})
              </h3>
              {/* Highlighted Total Consecrated */}
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Geral Consagrado</span>
                <span className="font-extrabold text-lg text-amber-400 font-mono">
                  {formatBRL(totalConsecrated)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400">
                    <th className="pb-2.5 font-semibold">Descrição</th>
                    <th className="pb-2.5 font-semibold">Data</th>
                    <th className="pb-2.5 font-semibold text-right">Valor</th>
                    <th className="pb-2.5 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {titheTransactions.map((item) => (
                    <tr key={item.id} className="hover:bg-white/2 transition">
                      <td className="py-3 text-slate-200">
                        Oferta Individual ({item.date})
                      </td>
                      <td className="py-3 text-slate-500 font-mono">{item.date}</td>
                      <td className="py-3 text-right font-extrabold text-amber-400 font-mono">
                        {formatBRL(item.amount)}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          id={`delete-tithe-${item.id}`}
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {titheTransactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-500 italic">
                        Nenhuma oferta consagrada para este mês.
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
