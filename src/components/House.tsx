import React, { useState } from 'react';
import { SystemConfig } from '../types';
import { Home, Settings, HelpCircle, Sparkles, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';

interface HouseProps {
  configs: SystemConfig[];
  onSaveConfig: (config: SystemConfig) => Promise<void>;
}

export default function House({ configs, onSaveConfig }: HouseProps) {
  const houseConfig = configs.find(c => c.id === 'house') || {
    id: 'house',
    model: 'Apartamento 2 quartos',
    quitTodayValue: 85000,
    totalInstallments: 360,
    paidInstallments: 120,
    installmentValue: 1500
  };

  // Local Form States
  const [model, setModel] = useState(houseConfig.model);
  const [quitTodayValue, setQuitTodayValue] = useState(String(houseConfig.quitTodayValue));
  const [totalInstallments, setTotalInstallments] = useState(String(houseConfig.totalInstallments || 360));
  const [paidInstallments, setPaidInstallments] = useState(String(houseConfig.paidInstallments || 120));
  const [installmentValue, setInstallmentValue] = useState(String(houseConfig.installmentValue || 1500));
  
  // Simulation states
  const [simulateCount, setSimulateCount] = useState('5');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculations
  const total = parseInt(totalInstallments) || 0;
  const paid = parseInt(paidInstallments) || 0;
  const remaining = Math.max(0, total - paid);
  const instVal = parseFloat(installmentValue) || 0;
  const quitVal = parseFloat(quitTodayValue) || 0;

  const totalContractVal = total * instVal;
  const totalPaidVal = paid * instVal;
  const remainingContractVal = remaining * instVal;
  const economy = remainingContractVal - quitVal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!model.trim()) {
      setErrorMsg('Por favor, informe a descrição do imóvel.');
      return;
    }

    const quitValParsed = parseFloat(quitTodayValue);
    const totalInstParsed = parseInt(totalInstallments);
    const paidInstParsed = parseInt(paidInstallments);
    const instValParsed = parseFloat(installmentValue);

    if (isNaN(quitValParsed) || quitValParsed < 0) {
      setErrorMsg('Valor para quitação inválido.');
      return;
    }
    if (isNaN(totalInstParsed) || totalInstParsed <= 0) {
      setErrorMsg('Total de parcelas inválido.');
      return;
    }
    if (isNaN(paidInstParsed) || paidInstParsed < 0 || paidInstParsed > totalInstParsed) {
      setErrorMsg('Parcelas pagas inválidas.');
      return;
    }
    if (isNaN(instValParsed) || instValParsed <= 0) {
      setErrorMsg('Valor da parcela inválido.');
      return;
    }

    const payload: SystemConfig = {
      id: 'house',
      model: model.trim(),
      quitTodayValue: quitValParsed,
      totalInstallments: totalInstParsed,
      paidInstallments: paidInstParsed,
      installmentValue: instValParsed
    };

    try {
      await onSaveConfig(payload);
      setSuccessMsg('Configurações do financiamento habitacional atualizadas!');
    } catch (err) {
      setErrorMsg('Erro ao salvar configurações.');
    }
  };

  // Prepayment simulation alert
  const handleSimulatePrepayment = () => {
    const numToPrepay = parseInt(simulateCount);
    if (isNaN(numToPrepay) || numToPrepay <= 0 || numToPrepay > remaining) {
      alert('Por favor, insira um número de parcelas válido para simular (menor ou igual às parcelas restantes).');
      return;
    }

    // Since each mortgage installment has compound interest, prepaying 1 installment
    // from back to front usually saves substantial interest. A conservative estimate of interest in mortgage is ~65-70%.
    // Let's compute exact interest savings.
    // If we prepay N installments, we pay the principal amount without interest.
    // Let's assume the amortized principal is ~35% and interest is ~65% of the installment.
    // So prepaying saves ~65% of the installment value!
    const singleInstallmentAmortizedPrincipal = instVal * 0.35;
    const singleInstallmentInterestSaved = instVal * 0.65;

    const totalCostToPrepay = singleInstallmentAmortizedPrincipal * numToPrepay;
    const totalInterestSavedSimulation = singleInstallmentInterestSaved * numToPrepay;
    const newRemainingInstallments = remaining - numToPrepay;

    alert(
      `📊 SIMULAÇÃO DE ANTECIPAÇÃO DE PARCELAS\n\n` +
      `🏠 Imóvel: ${model}\n` +
      `🎯 Parcelas a Antecipar: ${numToPrepay} parcelas\n\n` +
      `💵 Custo estimado para pagar hoje: ${formatBRL(totalCostToPrepay)}\n` +
      `💰 ECONOMIA TOTAL EM JUROS: ${formatBRL(totalInterestSavedSimulation)}\n` +
      `📅 Redução em tempo: ${numToPrepay} meses a menos no financiamento!\n` +
      `📉 Novo saldo restante: ${newRemainingInstallments} parcelas (${formatBRL(newRemainingInstallments * instVal)})`
    );
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 animate-fade-in" id="house-view">
      {/* Parameters Panel */}
      <section className="lg:col-span-2 space-y-6">
        
        {/* 6.1 Dados do Financiamento & Progress Bars */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shadow-inner">
              <Home size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-100">{houseConfig.model}</h2>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Controle de Amortização Imobiliária</p>
            </div>
          </div>

          {/* 6.2 Resumo do Financiamento (Grid de Métricas) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Valor da Parcela</span>
              <span className="text-base font-extrabold font-mono text-slate-100">{formatBRL(instVal)}</span>
            </div>
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Total de Parcelas</span>
              <span className="text-base font-extrabold font-mono text-slate-100">{total}</span>
            </div>
            <div className="bg-[#10b981]/10 p-3.5 rounded-xl border border-[#10b981]/20">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Parcelas Pagas</span>
              <span className="text-base font-extrabold font-mono text-emerald-400">{paid}</span>
            </div>
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Parcelas Restantes</span>
              <span className="text-base font-extrabold font-mono text-amber-500">{remaining}</span>
            </div>
            <div className="bg-[#10b981]/10 p-3.5 rounded-xl border border-[#10b981]/20">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Total Pago</span>
              <span className="text-base font-extrabold font-mono text-emerald-400">{formatBRL(totalPaidVal)}</span>
            </div>
            <div className="bg-[#ef4444]/10 p-3.5 rounded-xl border border-[#ef4444]/20">
              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5 uppercase">Saldo Devedor</span>
              <span className="text-base font-extrabold font-mono text-red-400">{formatBRL(remainingContractVal)}</span>
            </div>
          </div>

          {/* Progress bar visual */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progresso de Amortização (Quitação)</span>
              <span className="font-bold text-slate-200 font-mono">{total > 0 ? ((paid / total) * 100).toFixed(1) : '0'}%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${total > 0 ? (paid / total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 6.4 Sugestões do Assistente para Antecipação & 6.5 Dica do FinAI */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg space-y-4">
          <div className="flex justify-between items-start border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              <span>Simulador de Antecipação Inteligente</span>
            </h3>
            {/* 6.5 Dica do FinAI Badge */}
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              FinAI Advisor
            </span>
          </div>

          {/* 6.5 Dica do FinAI Content based on lifecycle */}
          <div className="p-3.5 bg-gradient-to-tr from-cyan-950/20 to-slate-950/20 border border-cyan-500/10 rounded-xl text-xs text-slate-300 leading-relaxed flex items-start gap-3">
            <AlertCircle size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <p>
              {remaining > 60 
                ? 'Com um financiamento longo, cada parcela antecipada representa uma economia significativa em juros compostos. Amortize pelo saldo devedor (de trás para frente) sempre que possível.'
                : 'Você está na reta final do financiamento do seu imóvel! Parabéns pela disciplina financeira até aqui! Continue firme.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick simulations block */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-3">
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">Simulação Rápida (Amortizar)</span>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Antecipar 12 parcelas:</span>
                  <span className="font-bold text-emerald-400">Economiza ~{formatBRL(instVal * 0.65 * 12)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Antecipar 24 parcelas:</span>
                  <span className="font-bold text-emerald-400">Economiza ~{formatBRL(instVal * 0.65 * 24)}</span>
                </div>
              </div>
            </div>

            {/* Simulated tool form input */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-semibold uppercase block">Quantas parcelas simular?</label>
                <input
                  id="house-simulate-count-input"
                  type="number"
                  min="1"
                  max={remaining}
                  value={simulateCount}
                  onChange={(e) => setSimulateCount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-white/5 rounded-lg text-slate-100 font-mono text-center text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSimulatePrepayment}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-[10px] rounded-lg tracking-wider uppercase transition shadow"
              >
                Simular Antecipação
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* Configuration Form */}
      <section className="lg:col-span-1">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
              <Settings size={15} />
            </div>
            <h3 className="font-semibold text-slate-100 text-sm font-display">Configure seu Imóvel</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-semibold">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Descrição do Imóvel */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Descrição do Imóvel</label>
              <input
                id="house-description-input"
                type="text"
                placeholder="Ex: Apartamento 2 quartos"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium"
              />
            </div>

            {/* Valor para quitação hoje */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Valor para Quitação Hoje (R$)</label>
              <input
                id="house-quitation-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quitTodayValue}
                onChange={(e) => setQuitTodayValue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            {/* Valor da Parcela */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Valor da Parcela (R$)</label>
              <input
                id="house-installment-value-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={installmentValue}
                onChange={(e) => setInstallmentValue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            {/* Total de parcelas */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Total de Parcelas do Financiamento</label>
              <input
                id="house-installments-total-input"
                type="number"
                placeholder="360"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            {/* Parcelas pagas */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Parcelas Pagas até Hoje</label>
              <input
                id="house-installments-paid-input"
                type="number"
                placeholder="120"
                value={paidInstallments}
                onChange={(e) => setPaidInstallments(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-white/5 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition font-medium font-mono"
              />
            </div>

            <button
              type="submit"
              id="house-submit-btn"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <TrendingUp size={14} />
              <span>Calcular Parâmetros</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
