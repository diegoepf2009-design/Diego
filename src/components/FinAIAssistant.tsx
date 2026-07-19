import { useState, useEffect } from 'react';
import { Transaction, Card, SystemConfig } from '../types';
import { X, Sparkles, TrendingUp, TrendingDown, DollarSign, CreditCard, Percent, ArrowRight } from 'lucide-react';

interface FinAIAssistantProps {
  currentTab: string;
  transactions: Transaction[];
  cards: Card[];
  configs: SystemConfig[];
  monthId: string;
}

export default function FinAIAssistant({ currentTab, transactions, cards, configs, monthId }: FinAIAssistantProps) {
  const [showBubble, setShowBubble] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');

  // Get car and house config
  const carConfig = configs.find(c => c.id === 'car');
  const houseConfig = configs.find(c => c.id === 'house');

  // Helper formatting currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Calculations for current month
  const monthTransactions = transactions.filter(t => t.monthId === monthId);
  const incomes = monthTransactions.filter(t => t.type === 'income');
  const expenses = monthTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalOwnIncome = incomes.filter(t => t.ownership === 'propria').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const monthlyBalance = totalIncome - totalExpense;

  const paidExpenses = expenses.filter(t => t.paymentStatus === 'Pago').reduce((sum, t) => sum + t.amount, 0);
  const pendingExpenses = expenses.filter(t => t.paymentStatus === 'A Pagar').reduce((sum, t) => sum + t.amount, 0);

  const commitmentRate = totalOwnIncome > 0 ? (totalExpense / totalOwnIncome) * 100 : 0;

  // Calculate card subtotals
  const cardBillings = cards.map(card => {
    const cardExpenses = monthTransactions.filter(t => t.cardId === card.id);
    const amount = cardExpenses.reduce((sum, t) => sum + t.amount, 0);
    return { ...card, amount };
  });

  // Calculate savings
  const calculateSavings = (config: SystemConfig | undefined) => {
    if (!config) return 0;
    const total = config.totalInstallments || 0;
    const paid = config.paidInstallments || 0;
    const remaining = total - paid;
    const val = config.installmentValue || 0;
    const quitNow = config.quitTodayValue || 0;
    return (remaining * val) - quitNow;
  };

  const carSavings = calculateSavings(carConfig);
  const houseSavings = calculateSavings(houseConfig);

  // Determine assistant humor/mood based on financial health
  const getAssistantMood = () => {
    if (monthlyBalance > 1000) {
      return {
        mood: 'happy' as const,
        color: '#10b981', // emerald
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      };
    } else if (monthlyBalance >= 0) {
      return {
        mood: 'neutral' as const,
        color: '#38bdf8', // sky-blue
        textColor: 'text-sky-400',
        bgColor: 'bg-sky-500/10',
      };
    } else {
      return {
        mood: 'sad' as const,
        color: '#f87171', // red (like the robot screen in the image)
        textColor: 'text-red-400',
        bgColor: 'bg-red-500/10',
      };
    }
  };

  const { mood, color: moodColor, textColor } = getAssistantMood();

  // Update assistant message based on currentTab and database states
  useEffect(() => {
    let message = '';
    switch (currentTab) {
      case 'dashboard':
        if (monthlyBalance > 2000) {
          message = `💪 Excelente saldo de ${formatCurrency(monthlyBalance)} este mês! Considere investir ou antecipar algumas parcelas.`;
        } else if (monthlyBalance > 0) {
          message = `📈 Você está no positivo com ${formatCurrency(monthlyBalance)}. Continue mantendo seus gastos sob controle!`;
        } else {
          message = `⚠️ Atenção! Seu saldo estimado para este mês está negativo em ${formatCurrency(Math.abs(monthlyBalance))}. Reveja seus gastos variáveis!`;
        }
        break;
      case 'incomes':
        message = '💰 Registre todas as suas receitas (salários, extras, de terceiros) para manter o controle financeiro absoluto.';
        break;
      case 'cards':
        message = '💳 Acompanhe de perto as faturas de seus cartões de crédito e evite pagar juros desnecessários.';
        break;
      case 'expenses':
        message = '📝 Registre todas as contas e boletos fixos ou variáveis para que o FinAI organize seus vencimentos.';
        break;
      case 'car':
        if (carConfig) {
          if (carSavings > 0) {
            message = `💡 Se quitar o seu ${carConfig.model} hoje por ${formatCurrency(carConfig.quitTodayValue)}, você economiza incríveis ${formatCurrency(carSavings)} de juros!`;
          } else {
            const paid = carConfig.paidInstallments || 0;
            const total = carConfig.totalInstallments || 0;
            message = `🚗 Você já pagou ${paid} de ${total} parcelas do seu financiamento. Continue com essa determinação!`;
          }
        } else {
          message = '🚗 Configure as parcelas e quitação de seu veículo para simular economias incríveis de juros.';
        }
        break;
      case 'house':
        if (houseConfig) {
          if (houseSavings > 0) {
            message = `🏡 Se quitar o financiamento do ${houseConfig.model} hoje por ${formatCurrency(houseConfig.quitTodayValue)}, você economiza ${formatCurrency(houseSavings)}!`;
          } else {
            const paid = houseConfig.paidInstallments || 0;
            const total = houseConfig.totalInstallments || 0;
            message = `🏠 Você já pagou ${paid} de ${total} parcelas. Continue firme na conquista da sua casa própria!`;
          }
        } else {
          message = '🏡 Acompanhe a amortização do seu financiamento habitacional e simule quitações de parcelas de trás para frente.';
        }
        break;
      case 'tithe':
        message = '🙏 Registre suas ofertas e dízimos e mantenha o acompanhamento das suas contribuições e consagrações.';
        break;
      case 'calendar':
        message = '📅 Acompanhe o fluxo de vencimentos. Fique de olho nos cartões e boletos marcados em amarelo e vermelho.';
        break;
      case 'settings':
        message = '⚙️ Configure seus cartões de crédito e crie categorias personalizadas com emojis para deixar o sistema com a sua cara.';
        break;
      default:
        message = 'Olá! Sou o FinAI, seu assistente financeiro pessoal. Como posso te ajudar a poupar hoje?';
    }
    setAssistantMessage(message);
    setShowBubble(true);
  }, [currentTab, monthlyBalance, carSavings, houseSavings, carConfig, houseConfig, monthId]);

  return (
    <>
      {/* Floating Assistant Trigger Container */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3 md:bottom-6">
        {/* Dialogue Bubble */}
        {showBubble && (
          <div className="relative max-w-xs md:max-w-sm rounded-2xl glass-panel p-4 text-xs leading-relaxed text-slate-100 shadow-xl border border-white/10 animate-fade-in">
            <button 
              onClick={() => setShowBubble(false)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white rounded-full transition"
            >
              <X size={12} />
            </button>
            <div className={`flex items-center gap-1.5 font-semibold ${textColor} mb-1`}>
              <Sparkles size={13} />
              <span>FinAI Coach</span>
            </div>
            <p className="pr-4">{assistantMessage}</p>
          </div>
        )}

        {/* Animated Avatar */}
        <button
          onClick={() => {
            setShowPanel(true);
            setShowBubble(false);
          }}
          className="group relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0a142c]/80 backdrop-blur-md shadow-2xl hover:scale-105 transition duration-300 border border-white/10 hover:border-cyan-400"
        >
          {/* Breathing digital glow background */}
          <span className="absolute -inset-1 rounded-2xl bg-cyan-500/10 opacity-0 group-hover:opacity-100 blur-md transition duration-300"></span>
          
          {/* Custom Robotic Face SVG matching reference */}
          <svg className="h-12 w-12 animate-breathe" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Head/Helmet (rounded rectangle with sky-blue contour) */}
            <rect x="18" y="10" width="64" height="42" rx="16" stroke="#38bdf8" strokeWidth="4" fill="#0d1c3f" />
            
            {/* Inner Face/Screen (color matches mood) */}
            <rect x="25" y="16" width="50" height="30" rx="10" stroke={moodColor} strokeWidth="3" fill="#040816" />
            
            {/* Eyes (colored by mood) */}
            <circle cx="41" cy="28" r="4.5" fill={moodColor} />
            <circle cx="59" cy="28" r="4.5" fill={moodColor} />
            
            {/* Mouth (shape and color depend on mood) */}
            {mood === 'happy' && (
              <path d="M42 36C44 39 56 39 58 36" stroke={moodColor} strokeWidth="3" strokeLinecap="round" />
            )}
            {mood === 'neutral' && (
              <path d="M43 37H57" stroke={moodColor} strokeWidth="3" strokeLinecap="round" />
            )}
            {mood === 'sad' && (
              <path d="M42 38C44 35 56 35 58 38" stroke={moodColor} strokeWidth="3" strokeLinecap="round" />
            )}
            
            {/* Body (rounded block with sky-blue contour, solid navy inside) */}
            <rect x="24" y="58" width="52" height="34" rx="14" stroke="#38bdf8" strokeWidth="4" fill="#1e3a8a" />
          </svg>
        </button>
      </div>

      {/* Side Intelligent Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={() => setShowPanel(false)}></div>
          
          {/* Side Drawer Body */}
          <div className="w-full max-w-md h-full bg-slate-950/95 border-l border-white/10 p-6 shadow-2xl flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center">
                  <svg className="h-9 w-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="18" y="10" width="64" height="42" rx="16" stroke="#38bdf8" strokeWidth="4" fill="#0d1c3f" />
                    <rect x="25" y="16" width="50" height="30" rx="10" stroke={moodColor} strokeWidth="3" fill="#040816" />
                    <circle cx="41" cy="28" r="4.5" fill={moodColor} />
                    <circle cx="59" cy="28" r="4.5" fill={moodColor} />
                    {mood === 'happy' && (
                      <path d="M42 36C44 39 56 39 58 36" stroke={moodColor} strokeWidth="3" strokeLinecap="round" />
                    )}
                    {mood === 'neutral' && (
                      <path d="M43 37H57" stroke={moodColor} strokeWidth="3" strokeLinecap="round" />
                    )}
                    {mood === 'sad' && (
                      <path d="M42 38C44 35 56 35 58 38" stroke={moodColor} strokeWidth="3" strokeLinecap="round" />
                    )}
                    <rect x="24" y="58" width="52" height="34" rx="14" stroke="#38bdf8" strokeWidth="4" fill="#1e3a8a" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-base">Painel Inteligente FinAI</h3>
                  <p className="text-xs text-slate-400">Coaching financeiro dinâmico</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPanel(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 space-y-6">
              {/* Financial Review */}
              <div className="rounded-xl bg-slate-900/60 p-4 border border-white/5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <DollarSign size={13} />
                  <span>Resumo de Competência ({monthId})</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                    <span className="text-xs text-slate-400 block mb-0.5">Receitas</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(totalIncome)}</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                    <span className="text-xs text-slate-400 block mb-0.5">Despesas</span>
                    <span className="font-semibold text-red-400">{formatCurrency(totalExpense)}</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Saldo Projetado</span>
                    <span className={`font-bold text-lg ${monthlyBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(monthlyBalance)}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    {monthlyBalance >= 0 ? (
                      <TrendingUp className="text-emerald-400" size={24} />
                    ) : (
                      <TrendingDown className="text-red-400" size={24} />
                    )}
                  </div>
                </div>

                {/* Income Commitment Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Percent size={11} /> Comprometimento da Renda
                    </span>
                    <span className="font-semibold text-slate-200">{commitmentRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-950/60 h-2.5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        commitmentRate <= 50 ? 'bg-emerald-500' : commitmentRate <= 70 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(commitmentRate, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {commitmentRate <= 50 
                      ? 'Excelente! Seu comprometimento de renda está super saudável (abaixo de 50%).'
                      : commitmentRate <= 70
                        ? 'Atenção moderada. Seus gastos comprometem entre 50% e 70% da sua renda.'
                        : 'Alerta! Mais de 70% da sua renda própria está comprometida com gastos.'}
                  </p>
                </div>
              </div>

              {/* Payments Tracker */}
              <div className="rounded-xl bg-slate-900/60 p-4 border border-white/5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Percent size={13} />
                  <span>Progresso de Pagamento</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg">
                    <span className="text-slate-400">Total Pago:</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(paidExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg">
                    <span className="text-slate-400">Pendente:</span>
                    <span className="font-semibold text-amber-400">{formatCurrency(pendingExpenses)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {(() => {
                    const totalBill = paidExpenses + pendingExpenses;
                    const pct = totalBill > 0 ? (paidExpenses / totalBill) * 100 : 0;
                    return (
                      <>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Contas Quitadas</span>
                          <span className="font-medium text-slate-200">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Credit Cards billing list */}
              <div className="rounded-xl bg-slate-900/60 p-4 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <CreditCard size={13} />
                  <span>Faturamento dos Cartões</span>
                </h4>

                <div className="space-y-2">
                  {cardBillings.map(card => (
                    <div key={card.id} className="flex items-center justify-between text-xs bg-slate-950/40 p-2.5 rounded-lg border-l-4" style={{ borderColor: card.color }}>
                      <span className="font-medium text-slate-200">{card.name}</span>
                      <span className="font-semibold text-slate-100">{formatCurrency(card.amount)}</span>
                    </div>
                  ))}
                  {cardBillings.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Nenhum cartão cadastrado.</p>
                  )}
                </div>
              </div>

              {/* FinAI Smart Tip */}
              <div className="rounded-xl bg-gradient-to-tr from-cyan-950/40 to-indigo-950/40 p-4 border border-cyan-500/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Sparkles size={12} />
                  <span>Dica Exclusiva FinAI</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {monthlyBalance < 0 
                    ? 'Seu fluxo de caixa está em déficit para esta competência. Tente negociar prazos ou verificar faturas de cartão antes que vençam para evitar multas de juros.'
                    : monthlyBalance < 1000 
                      ? 'Parabéns por fechar no azul! Que tal reservar pelo menos 10% do seu saldo líquido para a sua reserva de emergência no CDI hoje?'
                      : 'Você tem um saldo espetacular parado na conta. Este é o melhor momento para amortizar juros do seu financiamento de carro ou casa! Veja as simulações nas respectivas abas para entender a economia.'}
                </p>
              </div>
            </div>

            {/* Footer Close Button */}
            <button 
              onClick={() => setShowPanel(false)}
              className="mt-6 w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition shadow-lg flex items-center justify-center gap-2 group"
            >
              <span>Retornar ao Sistema</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
