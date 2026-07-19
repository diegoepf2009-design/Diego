import React, { useState } from 'react';
import { Card, Category } from '../types';
import { Settings as SettingsIcon, CreditCard, FolderPlus, Edit, Trash2, X, Plus } from 'lucide-react';

interface SettingsProps {
  cards: Card[];
  categories: Category[];
  onSaveCard: (card: Omit<Card, 'id' | 'balance'> & { id?: string }) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
  onSaveCategory: (cat: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export default function Settings({
  cards,
  categories,
  onSaveCard,
  onDeleteCard,
  onSaveCategory,
  onDeleteCategory
}: SettingsProps) {
  // --- CARD STATE MANAGER ---
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardColor, setCardColor] = useState('#8A05BE');
  const [cardDueDay, setCardDueDay] = useState('');
  const [cardError, setCardError] = useState('');
  const [cardSuccess, setCardSuccess] = useState('');

  // --- CATEGORY STATE MANAGER ---
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  // Color options for cards
  const cardColorOptions = [
    { name: 'Nubank Roxo', value: '#8A05BE' },
    { name: 'Roxo Claro', value: '#a855f7' },
    { name: 'BV Azul', value: '#0284c7' },
    { name: 'Inter Laranja', value: '#f97316' },
    { name: 'Itaú Azul', value: '#1e3a8a' },
    { name: 'Safra Ouro', value: '#b45309' },
    { name: 'Bradesco Vermelho', value: '#be123c' },
    { name: 'C6 Cinza', value: '#374151' }
  ];

  // --- CARD ACTIONS ---
  const handleEditCardClick = (card: Card) => {
    setEditingCardId(card.id);
    setCardName(card.name);
    setCardBrand(card.brand);
    setCardColor(card.color);
    setCardDueDay(card.dueDay.toString());
    setCardError('');
    setCardSuccess('');
  };

  const handleCancelCardEdit = () => {
    setEditingCardId(null);
    setCardName('');
    setCardBrand('Visa');
    setCardColor('#8A05BE');
    setCardDueDay('');
    setCardError('');
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError('');
    setCardSuccess('');

    if (!cardName.trim()) {
      setCardError('O nome do cartão é obrigatório.');
      return;
    }
    const dueDayNum = parseInt(cardDueDay);
    // Requirement: Mínimo 1 e máximo 31 para dia de vencimento
    if (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 31) {
      setCardError('O dia do vencimento deve ser um número entre 1 e 31.');
      return;
    }

    const payload: Omit<Card, 'id' | 'balance'> & { id?: string } = {
      name: cardName.trim(),
      brand: cardBrand,
      color: cardColor,
      dueDay: dueDayNum
    };

    if (editingCardId) {
      payload.id = editingCardId;
    }

    try {
      await onSaveCard(payload);
      setCardSuccess(editingCardId ? 'Cartão atualizado com sucesso!' : 'Cartão cadastrado com sucesso!');
      handleCancelCardEdit();
    } catch (err) {
      setCardError('Erro ao salvar cartão.');
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cartão? Isso removerá o cartão do cadastro.')) {
      try {
        await onDeleteCard(id);
        setCardSuccess('Cartão excluído com sucesso.');
      } catch (err) {
        setCardError('Erro ao excluir cartão.');
      }
    }
  };

  // --- CATEGORY ACTIONS ---
  const handleEditCatClick = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatError('');
    setCatSuccess('');
  };

  const handleCancelCatEdit = () => {
    setEditingCatId(null);
    setCatName('');
    setCatType('expense');
    setCatError('');
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');

    if (!catName.trim()) {
      setCatError('O nome da categoria é obrigatório.');
      return;
    }

    const payload: Category = {
      id: editingCatId || `cat-custom-${Date.now()}`,
      name: catName.trim(),
      type: catType
    };

    try {
      await onSaveCategory(payload);
      setCatSuccess(editingCatId ? 'Categoria atualizada com sucesso!' : 'Categoria cadastrada com sucesso!');
      handleCancelCatEdit();
    } catch (err) {
      setCatError('Erro ao salvar categoria.');
    }
  };

  const handleDeleteCat = async (cat: Category) => {
    if (cat.isSystem) {
      alert('Categorias do sistema não podem ser excluídas.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${cat.name}"?`)) {
      try {
        await onDeleteCategory(cat.id);
        setCatSuccess('Categoria excluída com sucesso.');
      } catch (err) {
        setCatError('Erro ao excluir categoria.');
      }
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id="settings-view">
      
      {/* 9.1 GERENCIAR CARTÕES */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Form */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm font-display">
              {editingCardId ? 'Atualizar Cartão' : 'Cadastrar Novo Cartão'}
            </h3>
          </div>

          <form onSubmit={handleCardSubmit} className="space-y-4 text-xs">
            {cardError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold">
                {cardError}
              </div>
            )}
            {cardSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-semibold">
                {cardSuccess}
              </div>
            )}

            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Nome do Cartão</label>
              <input
                id="settings-card-name-input"
                type="text"
                placeholder="Ex: Nubank Diego"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
              />
            </div>

            {/* Bandeira */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Bandeira</label>
              <select
                id="settings-card-brand-select"
                value={cardBrand}
                onChange={(e) => setCardBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#060c1f] border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Nubank">Nubank</option>
                <option value="Inter">Inter</option>
                <option value="BV">BV</option>
                <option value="Elo">Elo</option>
                <option value="American Express">American Express</option>
              </select>
            </div>

            {/* Dia do Vencimento */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Dia do Vencimento (1 a 31)</label>
              <input
                id="settings-card-due-input"
                type="number"
                min="1"
                max="31"
                placeholder="Ex: 10"
                value={cardDueDay}
                onChange={(e) => setCardDueDay(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            {/* Cor do Cartão */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium font-semibold">Cor do Cartão</label>
              <div className="grid grid-cols-4 gap-2">
                {cardColorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCardColor(opt.value)}
                    className={`h-7 rounded-lg border flex items-center justify-center transition ${
                      cardColor === opt.value ? 'border-white scale-105' : 'border-transparent hover:scale-102'
                    }`}
                    style={{ backgroundColor: opt.value }}
                    title={opt.name}
                  >
                    {cardColor === opt.value && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              {editingCardId && (
                <button
                  type="button"
                  onClick={handleCancelCardEdit}
                  className="flex-1 py-3 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <X size={14} />
                  <span>Cancelar</span>
                </button>
              )}
              <button
                type="submit"
                id="settings-card-submit-btn"
                className="flex-2 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>{editingCardId ? 'Atualizar Cartão' : 'Cadastrar Cartão'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card List Grid */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4 lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Meus Cartões Cadastrados
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map(card => (
              <div 
                key={card.id} 
                className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between border-l-4 hover:border-l-8 hover:bg-slate-900/60 transition-all duration-200 shadow"
                style={{ borderLeftColor: card.color }}
              >
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{card.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Bandeira: {card.brand}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Vencimento: Dia {card.dueDay}</p>
                </div>

                <div className="flex gap-1">
                  <button
                    id={`settings-edit-card-${card.id}`}
                    onClick={() => handleEditCardClick(card)}
                    className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-white/5 transition"
                    title="Editar Cartão"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    id={`settings-delete-card-${card.id}`}
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                    title="Excluir Cartão"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {cards.length === 0 && (
              <p className="text-xs text-slate-500 italic py-6 text-center col-span-2">
                Nenhum cartão cadastrado no momento.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 9.2 GERENCIAR CATEGORIAS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Form */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <div className="h-8 w-8 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <FolderPlus size={16} />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm font-display">
              {editingCatId ? 'Editar Categoria' : 'Cadastrar Categoria'}
            </h3>
          </div>

          <form onSubmit={handleCatSubmit} className="space-y-4 text-xs">
            {catError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold">
                {catError}
              </div>
            )}
            {catSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-semibold">
                {catSuccess}
              </div>
            )}

            {/* Nome com Emoji */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Nome (use Emoji + Nome)</label>
              <input
                id="settings-cat-name-input"
                type="text"
                placeholder="Ex: 🍿 Entretenimento"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
              />
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium font-semibold">Tipo de Transação</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCatType('expense')}
                  className={`py-2 px-3 rounded-xl font-semibold transition border ${
                    catType === 'expense' 
                      ? 'bg-red-500/10 border-red-500 text-red-400' 
                      : 'bg-slate-900/40 border-white/5 text-slate-400'
                  }`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setCatType('income')}
                  className={`py-2 px-3 rounded-xl font-semibold transition border ${
                    catType === 'income' 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                      : 'bg-slate-900/40 border-white/5 text-slate-400'
                  }`}
                >
                  Receita
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              {editingCatId && (
                <button
                  type="button"
                  onClick={handleCancelCatEdit}
                  className="flex-1 py-3 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <X size={14} />
                  <span>Cancelar</span>
                </button>
              )}
              <button
                type="submit"
                id="settings-cat-submit-btn"
                className="flex-2 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>{editingCatId ? 'Atualizar Categoria' : 'Cadastrar Categoria'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Category List */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4 lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Categorias Ativas
          </h3>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1.5">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between hover:bg-slate-900/60 transition shadow"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-100 text-xs">{cat.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                    cat.type === 'income' 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {cat.type === 'income' ? 'Receita' : 'Despesa'}
                  </span>
                  {cat.isSystem && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[8px] font-bold uppercase">
                      Sistema
                    </span>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    id={`settings-edit-cat-${cat.id}`}
                    onClick={() => handleEditCatClick(cat)}
                    className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-white/5 transition"
                    title="Editar Categoria"
                  >
                    <Edit size={13} />
                  </button>
                  {!cat.isSystem && (
                    <button
                      id={`settings-delete-cat-${cat.id}`}
                      onClick={() => handleDeleteCat(cat)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                      title="Excluir Categoria"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
