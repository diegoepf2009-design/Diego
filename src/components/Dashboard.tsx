import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  PieChart as PieIcon, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Bookmark,
  Sparkles
} from 'lucide-react';
import { Transaction, Card, Category } from '../types';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as ChartTooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

interface DashboardProps {
  monthId: string;
  transactions: Transaction[];
  cards: Card[];
  categories: Category[];
  onNavigateToTab: (tab: string) => void;
  onTogglePaymentStatus: (transId: string) => Promise<void>;
}

export default function Dashboard({
  monthId,
  transactions,
  cards,
  categories,
  onNavigateToTab,
  onTogglePaymentStatus
}: DashboardProps) {

  // Currency Formatter
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Resolve previous month ID
  const prevMonthId = useMemo(() => {
    const [year, month] = monthId.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, [monthId]);

  // Map category ID to Category details
  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  // Current Month Data
  const currentMonthTrans = useMemo(() => {
    return transactions.filter(t => t.monthId === monthId);
  }, [transactions, monthId]);

  // Previous Month Data
  const prevMonthTrans = useMemo(() => {
    return transactions.filter(t => t.monthId === prevMonthId);
  }, [transactions, prevMonthId]);

  // 1.1 Cards data for carousel: Sum card expenses for THIS month
  const cardListWithBalances = useMemo(() => {
    return cards.map(card => {
      const expensesOnCard = currentMonthTrans.filter(t => t.cardId === card.id && t.type === 'expense');
      const totalSpentThisMonth = expensesOnCard.reduce((sum, t) => sum + t.amount, 0);
      return {
        ...card,
        balanceThisMonth: totalSpentThisMonth
      };
    });
  }, [cards, currentMonthTrans]);

  // 1.2 Metrics
  const metrics = useMemo(() => {
    const ownIncome = currentMonthTrans
      .filter(t => t.type === 'income' && t.ownership === 'propria')
      .reduce((sum, t) => sum + t.amount, 0);

    const thirdIncome = currentMonthTrans
      .filter(t => t.type === 'income' && t.ownership === 'terceiro')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = ownIncome + thirdIncome;

    const totalExpense = currentMonthTrans
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    return {
      ownIncome,
      thirdIncome,
      totalIncome,
      totalExpense,
      netBalance
    };
  }, [currentMonthTrans]);

  // 1.3 Commitment & Fixed vs Variable Costs
  const commitmentData = useMemo(() => {
    const { totalExpense, ownIncome } = metrics;
    const rate = ownIncome > 0 ? (totalExpense / ownIncome) * 100 : 0;

    // Fixed expense categories list (Moradia, Financiamentos, Saúde)
    // Map of fixed keywords or ids:
    const fixedCategoriesKeywords = ['moradia', 'financiamento', 'saúde', 'saude', 'dizimo', 'dízimo'];
    
    let fixedTotal = 0;
    let variableTotal = 0;

    currentMonthTrans.forEach(t => {
      if (t.type === 'expense') {
        const cat = categoryMap.get(t.categoryId);
        const catNameLower = cat ? cat.name.toLowerCase() : '';
        const isFixed = fixedCategoriesKeywords.some(kw => catNameLower.includes(kw));
        
        if (isFixed) {
          fixedTotal += t.amount;
        } else {
          variableTotal += t.amount;
        }
      }
    });

    return {
      rate,
      fixedTotal,
      variableTotal
    };
  }, [metrics, currentMonthTrans, categoryMap]);

  // 1.4.1 doughnut (PieChart) data of current month expenses per category
  const expensePieData = useMemo(() => {
    const groupMap: { [name: string]: number } = {};
    
    currentMonthTrans.forEach(t => {
      if (t.type === 'expense') {
        const cat = categoryMap.get(t.categoryId);
        const name = cat ? cat.name : 'Outros';
        groupMap[name] = (groupMap[name] || 0) + t.amount;
      }
    });

    const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6', '#6366f1'];

    return Object.entries(groupMap).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [currentMonthTrans, categoryMap]);

  // 1.4.2 Comparison BarChart Data (Current vs Prev Month)
  const comparisonChartData = useMemo(() => {
    const currentIn = currentMonthTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const currentOut = currentMonthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const prevIn = prevMonthTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const prevOut = prevMonthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return [
      {
        name: 'Mês Anterior',
        Receitas: prevIn,
        Despesas: prevOut
      },
      {
        name: 'Mês Atual',
        Receitas: currentIn,
        Despesas: currentOut
      }
    ];
  }, [currentMonthTrans, prevMonthTrans]);

  // 1.5 Lists and tables
  // Próximos Vencimentos: A pagar expenses, sorted by date
  const upcomingDues = useMemo(() => {
    return currentMonthTrans
      .filter(t => t.type === 'expense' && t.paymentStatus === 'A Pagar')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5); // top 5
  }, [currentMonthTrans]);

  // Resumo de Pagamentos: Paid vs Pending
  const paymentsSummary = useMemo(() => {
    const paid = currentMonthTrans.filter(t => t.type === 'expense' && t.paymentStatus === 'Pago').reduce((sum, t) => sum + t.amount, 0);
    const pending = currentMonthTrans.filter(t => t.type === 'expense' && t.paymentStatus === 'A Pagar').reduce((sum, t) => sum + t.amount, 0);
    const total = paid + pending;
    const pct = total > 0 ? (paid / total) * 100 : 0;
    return { paid, pending, total, pct };
  }, [currentMonthTrans]);

  // Gastos de Terceiros: expenses with ownership === 'terceiro'
  const thirdPartyExpenses = useMemo(() => {
    return currentMonthTrans
      .filter(t => t.type === 'expense' && t.ownership === 'terceiro')
      .slice(0, 5);
  }, [currentMonthTrans]);

  // Parcelamentos Ativos: expenses with frequency === 'installment'
  const activeInstallments = useMemo(() => {
    return currentMonthTrans
      .filter(t => t.type === 'expense' && t.frequency === 'installment')
      .slice(0, 5);
  }, [currentMonthTrans]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="dashboard-container">
      {/* 1.1 Cards de Cartões - Carrossel Horizontal */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase flex items-center gap-1.5 font-display">
            <CreditCard size={15} className="text-cyan-400" />
            <span>Meus Cartões ({monthId})</span>
          </h2>
          <button 
            onClick={() => onNavigateToTab('settings')}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 transition hover:underline"
          >
            Configurar Cartões
          </button>
        </div>

        {/* Horizontal scroll container */}
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin">
          {cardListWithBalances.map(card => (
            <div
              key={card.id}
              className="w-64 h-36 shrink-0 rounded-2xl p-4 flex flex-col justify-between snap-start relative overflow-hidden shadow-lg border border-white/10 select-none group hover:scale-[1.02] transition duration-300 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${card.color}dd 0%, #030611dd 100%)`,
              }}
              onClick={() => onNavigateToTab('cards')}
            >
              {/* Subtle tech grid inside card */}
              <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40 opacity-40"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  {/* Small, elegant non-fat card name font */}
                  <h3 className="text-[11px] uppercase tracking-wider font-medium text-white/70">
                    {card.name}
                  </h3>
                  <p className="text-[9px] text-white/50 font-mono mt-0.5">Vencimento: Dia {card.dueDay}</p>
                </div>
                <div className="px-2 py-0.5 bg-white/10 rounded-md text-[9px] text-white font-bold tracking-wider font-mono">
                  {card.brand.toUpperCase()}
                </div>
              </div>

              <div className="relative z-10">
                <span className="text-[9px] text-white/60 block font-mono">FATURA ATUAL</span>
                <span className="text-xl font-bold font-display text-white tracking-tight">
                  {formatBRL(card.balanceThisMonth)}
                </span>
              </div>
            </div>
          ))}

          {cardListWithBalances.length === 0 && (
            <div className="w-full py-10 rounded-2xl glass-panel flex flex-col items-center justify-center text-slate-400 border border-white/5">
              <CreditCard size={28} className="text-slate-500 mb-1.5" />
              <p className="text-xs italic">Nenhum cartão cadastrado.</p>
              <button 
                onClick={() => onNavigateToTab('settings')}
                className="text-xs text-cyan-400 hover:underline mt-1"
              >
                Cadastre seu primeiro cartão
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 1.2 Métricas Principais (KPI Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Receitas Próprias */}
        <div className="glass-panel rounded-2xl p-4.5 border border-white/5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Receitas Próprias</span>
            <h3 className="text-lg font-bold font-display text-slate-100 tracking-tight">
              {formatBRL(metrics.ownIncome)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-inner">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* KPI: Receitas de Terceiros */}
        <div className="glass-panel rounded-2xl p-4.5 border border-white/5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Receitas Terceiros</span>
            <h3 className="text-lg font-bold font-display text-slate-100 tracking-tight">
              {formatBRL(metrics.thirdIncome)}
            </h3>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-inner">
            <ArrowUpRight size={20} />
          </div>
        </div>

        {/* KPI: Despesas Totais */}
        <div className="glass-panel rounded-2xl p-4.5 border border-white/5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Despesas Totais</span>
            <h3 className="text-lg font-bold font-display text-slate-100 tracking-tight">
              {formatBRL(metrics.totalExpense)}
            </h3>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 shadow-inner">
            <TrendingDown size={20} />
          </div>
        </div>

        {/* KPI: Saldo Líquido do Mês */}
        <div className="glass-panel rounded-2xl p-4.5 border border-white/5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Saldo Líquido</span>
            <h3 className={`text-lg font-bold font-display tracking-tight ${metrics.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatBRL(metrics.netBalance)}
            </h3>
          </div>
          <div className={`p-3 rounded-xl border shadow-inner ${
            metrics.netBalance >= 0 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <DollarSign size={20} />
          </div>
        </div>
      </section>

      {/* 1.3 Cards de Comprometimento e Gastos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Comprometimento da Renda */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between shadow-md lg:col-span-1">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Comprometimento de Renda</span>
              <span className="font-mono text-xs font-bold text-slate-100">
                {commitmentData.rate.toFixed(1)}%
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-950/60 h-3 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  commitmentData.rate <= 50 ? 'bg-emerald-500' : commitmentData.rate <= 70 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(commitmentData.rate, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[11px] text-slate-400">
            <span>Fórmula: Despesas / Renda Própria</span>
            <span className={`px-2 py-0.5 rounded-full font-semibold text-[9px] uppercase ${
              commitmentData.rate <= 50 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : commitmentData.rate <= 70 
                  ? 'bg-amber-500/10 text-amber-400' 
                  : 'bg-red-500/10 text-red-400'
            }`}>
              {commitmentData.rate <= 50 ? 'Saudável' : commitmentData.rate <= 70 ? 'Atenção' : 'Alerta'}
            </span>
          </div>
        </div>

        {/* Gastos Fixos */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between shadow-md lg:col-span-1">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Gastos Fixos Estimados</span>
            <h3 className="text-2xl font-extrabold font-display text-amber-400">
              {formatBRL(commitmentData.fixedTotal)}
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Moradia, Amortizações, Planos de Saúde e Carro.
            </p>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400 shadow-md">
            <Bookmark size={22} />
          </div>
        </div>

        {/* Gastos Variáveis */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center justify-between shadow-md lg:col-span-1">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Gastos Variáveis</span>
            <h3 className="text-2xl font-extrabold font-display text-cyan-400">
              {formatBRL(commitmentData.variableTotal)}
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Alimentação, Supermercados, Lazer e Outros.
            </p>
          </div>
          <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400 shadow-md">
            <Sparkles size={22} />
          </div>
        </div>
      </section>

      {/* 1.4 Gráficos (Obrigatórios) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Despesas por Categoria */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-md space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <PieIcon size={14} className="text-cyan-400" />
            <span>Despesas por Categoria</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    formatter={(value: number) => [formatBRL(value), 'Valor']} 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '11px', color: '#6b7db3' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 italic">Nenhum gasto registrado neste mês.</p>
            )}
          </div>
        </div>

        {/* Gráfico 2: Evolução Financeira */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-md space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-cyan-400" />
            <span>Evolução Financeira (Mês Anterior vs Mês Atual)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#6b7db3" fontSize={11} />
                <YAxis stroke="#6b7db3" fontSize={11} />
                <ChartTooltip 
                  formatter={(value: number) => [formatBRL(value), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 1.5 Listas e Tabelas */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Próximos Vencimentos & Resumo de Pagamentos */}
        <div className="space-y-6">
          {/* Próximos Vencimentos */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calendar size={14} className="text-cyan-400" />
                <span>Próximos Vencimentos</span>
              </h3>
              <button 
                onClick={() => onNavigateToTab('calendar')}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Ver tudo
              </button>
            </div>

            <div className="space-y-2">
              {upcomingDues.map(item => {
                const cat = categoryMap.get(item.categoryId);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5 hover:border-white/10 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs">
                        {cat ? cat.name.split(' ')[0] : '📝'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200 text-xs block">{item.description}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Vence {item.date}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-400 text-xs font-mono">{formatBRL(item.amount)}</span>
                      <button
                        onClick={() => onTogglePaymentStatus(item.id)}
                        className="px-2 py-1 bg-red-500/10 border border-red-500/25 hover:bg-red-500 hover:text-white transition rounded-lg text-[10px] text-red-400 font-semibold uppercase"
                      >
                        Pagar
                      </button>
                    </div>
                  </div>
                );
              })}

              {upcomingDues.length === 0 && (
                <div className="py-6 flex flex-col items-center justify-center text-slate-500 text-xs italic">
                  <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
                  <span>Nenhum vencimento pendente!</span>
                </div>
              )}
            </div>
          </div>

          {/* Resumo de Pagamentos */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Clock size={14} className="text-cyan-400" />
              <span>Resumo de Pagamentos</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-500 block mb-0.5">Total Pago</span>
                  <span className="font-bold text-emerald-400 text-sm font-mono">{formatBRL(paymentsSummary.paid)}</span>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-500 block mb-0.5">Pendente</span>
                  <span className="font-bold text-amber-400 text-sm font-mono">{formatBRL(paymentsSummary.pending)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Porcentagem de Contas Pagas</span>
                  <span className="font-bold text-slate-300 font-mono">{paymentsSummary.pct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${paymentsSummary.pct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gastos de Terceiros & Parcelamentos Ativos */}
        <div className="space-y-6">
          {/* Gastos de Terceiros */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-cyan-400" />
              <span>Gastos de Terceiros</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400">
                    <th className="pb-2 font-semibold">Descrição</th>
                    <th className="pb-2 font-semibold">Vencimento</th>
                    <th className="pb-2 font-semibold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {thirdPartyExpenses.map(item => (
                    <tr key={item.id} className="hover:bg-white/2 transition">
                      <td className="py-2.5 font-medium text-slate-300">{item.description}</td>
                      <td className="py-2.5 text-slate-500 font-mono">{item.date}</td>
                      <td className="py-2.5 text-right font-bold text-red-400 font-mono">{formatBRL(item.amount)}</td>
                    </tr>
                  ))}
                  {thirdPartyExpenses.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-500 italic">
                        Nenhum gasto de terceiro este mês.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parcelamentos Ativos */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CreditCard size={14} className="text-cyan-400" />
              <span>Parcelamentos Ativos</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400">
                    <th className="pb-2 font-semibold">Item</th>
                    <th className="pb-2 font-semibold">Parcela</th>
                    <th className="pb-2 font-semibold text-right">Valor/Mês</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeInstallments.map(item => (
                    <tr key={item.id} className="hover:bg-white/2 transition">
                      <td className="py-2.5 font-medium text-slate-300">{item.description}</td>
                      <td className="py-2.5 text-slate-400 font-semibold font-mono">
                        {item.installmentCurrent} / {item.installmentTotal}
                      </td>
                      <td className="py-2.5 text-right font-bold text-red-400 font-mono">{formatBRL(item.amount)}</td>
                    </tr>
                  ))}
                  {activeInstallments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-500 italic">
                        Nenhum parcelamento ativo este mês.
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
